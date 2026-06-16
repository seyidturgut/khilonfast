import axios from 'axios';
import { API_BASE_URL, logApiTarget } from '../config/api';

logApiTarget();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Simple Frontend Cache
const frontendCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Kullanıcıya/oturuma bağlı cevaplar cache'lenmemeli — yoksa kullanıcı değişince
// önceki kullanıcının verisi geri okunur (ör. admin → user geçişinde admin paneli açılır).
const NON_CACHEABLE_PATTERNS = [
    /^\/auth\//,
    /^\/profile/,
    /^\/orders/,
    /^\/payment\//,
    /^\/admin\//,
    /^\/crm\//,
    /^\/onboarding-form/,
    /^\/company/,
    // Ürün fiyatları admin tarafından güncellenebildiği için 5 dk cache çok uzun;
    // bunun yerine her isteği taze çekiyoruz (backend zaten kendi node-cache'ini admin write'larında flush ediyor).
    /^\/products/,
    /^\/coupons/
];

const isCacheable = (url?: string) => {
    if (!url) return false;
    return !NON_CACHEABLE_PATTERNS.some((re) => re.test(url));
};

/**
 * Cache'i sıfırla. Login / logout / activateToken sırasında çağrılır ki bir önceki
 * oturumun verisi yeni oturuma sızmasın.
 */
export const clearApiCache = () => {
    frontendCache.clear();
};

// Build-time prerender (puppeteer) sırasında API isteklerini hemen boş cevapla short-circuit et —
// aksi halde axios sonsuza kadar bekler ve prerender timeout olur.
const isPrerendering = typeof window !== 'undefined' && (window as any).__PRERENDER__ === true;

// Add token to requests
api.interceptors.request.use(
    (config) => {
        if (isPrerendering) {
            // Tüm istekleri boş cevap döndür, network'e çıkma
            config.adapter = () => Promise.resolve({
                data: {},
                status: 200,
                statusText: 'OK (prerender stub)',
                headers: config.headers,
                config,
                request: {}
            });
            return config;
        }
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Cache handling for GET requests (kullanıcıya özel endpointler hariç)
        if (config.method === 'get' && isCacheable(config.url)) {
            const cacheKey = config.url + JSON.stringify(config.params || {});
            const cachedValue = frontendCache.get(cacheKey);

            if (cachedValue && (Date.now() - cachedValue.timestamp < CACHE_TTL)) {
                // Return cached data
                config.adapter = () => {
                    return Promise.resolve({
                        data: cachedValue.data,
                        status: 200,
                        statusText: 'OK',
                        headers: config.headers,
                        config: config,
                        request: {}
                    });
                };
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to save successful GET responses to cache
api.interceptors.response.use(
    (response) => {
        if (
            response.config.method === 'get' &&
            response.status === 200 &&
            isCacheable(response.config.url)
        ) {
            const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
            frontendCache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// API Functions
type ApiPayload = Record<string, any>;
type IdParam = number | string;

export const authAPI = {
    register: (data: ApiPayload) => api.post('/auth/register', data),
    login: (data: ApiPayload) => api.post('/auth/login', data),
    google: (data: ApiPayload) => api.post('/auth/google', data),
    getMe: () => api.get('/auth/me'),
    setPassword: (password: string) => api.post('/auth/set-password', { password }),
    forgotPassword: (email: string, lang: 'tr' | 'en' = 'tr') =>
        api.post('/auth/forgot-password', { email, lang })
};

export const productsAPI = {
    getAll: () => api.get('/products'),
    getById: (id: IdParam) => api.get(`/products/${id}`),
    getByKey: (key: IdParam) => api.get(`/products/key/${key}`)
};

export const ordersAPI = {
    create: (data: ApiPayload) => api.post('/orders', data),
    getById: (id: IdParam) => api.get(`/orders/${id}`),
    getUserOrders: (userId: IdParam) => api.get(`/orders/user/${userId}`)
};

export const couponAPI = {
    validate: (data: ApiPayload) => api.post('/coupons/validate', data)
};

export const paymentAPI = {
    initiate: (data: ApiPayload) => api.post('/payment/initiate', data),
    bankTransfer: (data: ApiPayload) => api.post('/payment/bank-transfer', data),
    manualTransfer: (data: ApiPayload) => api.post('/payment/manual-transfer', data),
    getStatus: (orderId: IdParam) => api.get(`/payment/status/${orderId}`),
    getSavedCards: () => api.get('/payment/cards'),
    deleteSavedCard: (cardId: IdParam) => api.delete(`/payment/cards/${cardId}`),
    setDefaultCard: (cardId: IdParam) => api.patch(`/payment/cards/${cardId}/default`, {}),
    getBankAccounts: () => api.get('/payment/bank-accounts'),
    getManualBankAccounts: (currency?: 'TRY' | 'USD') =>
        api.get('/manual-bank-accounts' + (currency ? `?currency=${currency}` : ''))
};

export const adminBankAccountsAPI = {
    list: () => api.get('/admin/bank-accounts'),
    create: (data: ApiPayload) => api.post('/admin/bank-accounts', data),
    update: (id: IdParam, data: ApiPayload) => api.put(`/admin/bank-accounts/${id}`, data),
    delete: (id: IdParam) => api.delete(`/admin/bank-accounts/${id}`)
};

export const adminManualBankAccountsAPI = {
    list: () => api.get('/admin/manual-bank-accounts'),
    create: (data: ApiPayload) => api.post('/admin/manual-bank-accounts', data),
    update: (id: IdParam, data: ApiPayload) => api.put(`/admin/manual-bank-accounts/${id}`, data),
    delete: (id: IdParam) => api.delete(`/admin/manual-bank-accounts/${id}`)
};

export const adminOrdersAPI = {
    confirmManualPayment: (orderId: IdParam) =>
        api.post(`/admin/orders/${orderId}/confirm-manual-payment`, {}),
    listManualOrders: (status: 'all' | 'pending' | 'completed' | 'cancelled' = 'pending') =>
        api.get(`/admin/manual-orders?status=${status}`)
};

export const emailAutomationAPI = {
    logEvent: (data: ApiPayload) => api.post('/email-automation/event', data),
    getSequences: () => api.get('/admin/email-sequences'),
    updateSequence: (id: IdParam, data: ApiPayload) => api.put(`/admin/email-sequences/${id}`, data),
    updateStep: (id: IdParam, data: ApiPayload) => api.put(`/admin/email-sequence-steps/${id}`, data),
    getQueue: (params?: ApiPayload) => api.get('/admin/email-queue', { params }),
    getStats: () => api.get('/admin/email-stats')
};

// CRM modülü — Faz 1: Contacts Foundation
export interface CrmContact {
    id: number;
    user_id: number | null;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    company: string;
    status: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained' | 'pending';
    source: string;
    score: number;
    ltv: number;
    ltv_currency: string;
    custom_fields: Record<string, unknown> | null;
    last_activity_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface CrmContactListParams {
    q?: string;
    status?: string;
    source?: string;
    min_score?: number;
    page?: number;
    per_page?: number;
    sort?: 'created_at' | 'updated_at' | 'last_activity_at' | 'score' | 'email';
    dir?: 'asc' | 'desc';
}

export interface CrmTag {
    id: number;
    slug: string;
    name: string;
    color: string;
    description: string | null;
    contact_count: number;
    created_at?: string;
}

export interface CrmListRule {
    field: string;
    op: string;
    value: unknown;
}
export interface CrmListRules {
    match: 'all' | 'any';
    rules: CrmListRule[];
}
export interface CrmList {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    type: 'static' | 'smart';
    rules: CrmListRules | null;
    contact_count: number;
    created_at?: string;
    updated_at?: string;
}

export const crmAPI = {
    listContacts: (params?: CrmContactListParams) => api.get('/crm/contacts', { params }),
    getContact: (id: IdParam) => api.get(`/crm/contacts/${id}`),
    getContactListMemberships: (id: IdParam) => api.get(`/crm/contacts/${id}/list-memberships`),
    createContact: (data: Partial<CrmContact>) => api.post('/crm/contacts', data),
    updateContact: (id: IdParam, data: Partial<CrmContact>) => api.put(`/crm/contacts/${id}`, data),
    deleteContact: (id: IdParam) => api.delete(`/crm/contacts/${id}`),
    bulkDelete: (ids: number[]) => api.post('/crm/contacts/bulk-delete', { ids }),
    runBackfill: () => api.post('/crm/backfill', {}),
    getStats: () => api.get('/crm/stats'),
    listCustomFields: () => api.get('/crm/custom-fields'),
    upsertCustomField: (data: ApiPayload) => api.post('/crm/custom-fields', data),
    deleteCustomField: (id: IdParam) => api.delete(`/crm/custom-fields/${id}`),

    // Faz 2: Tags
    listTags: () => api.get('/crm/tags'),
    createTag: (data: Partial<CrmTag>) => api.post('/crm/tags', data),
    updateTag: (id: IdParam, data: Partial<CrmTag>) => api.put(`/crm/tags/${id}`, data),
    deleteTag: (id: IdParam) => api.delete(`/crm/tags/${id}`),

    // Contact tags
    getContactTags: (contactId: IdParam) => api.get(`/crm/contacts/${contactId}/tags`),
    addContactTags: (contactId: IdParam, tagIds: number[]) =>
        api.post(`/crm/contacts/${contactId}/tags`, { tag_ids: tagIds }),
    removeContactTags: (contactId: IdParam, tagIds: number[]) =>
        api.delete(`/crm/contacts/${contactId}/tags`, { data: { tag_ids: tagIds } }),
    bulkTag: (contactIds: number[], tagIds: number[], mode: 'add' | 'remove' = 'add') =>
        api.post('/crm/contacts/bulk-tag', { contact_ids: contactIds, tag_ids: tagIds, mode }),

    // Faz 2: Lists
    listLists: () => api.get('/crm/lists'),
    getList: (id: IdParam) => api.get(`/crm/lists/${id}`),
    createList: (data: { slug?: string; name: string; description?: string; type: 'static' | 'smart'; rules?: CrmListRules }) =>
        api.post('/crm/lists', data),
    updateList: (id: IdParam, data: Partial<CrmList>) => api.put(`/crm/lists/${id}`, data),
    deleteList: (id: IdParam) => api.delete(`/crm/lists/${id}`),
    previewList: (rules: CrmListRules) => api.post('/crm/lists/preview', { rules }),
    getListContacts: (id: IdParam, params?: { page?: number; per_page?: number }) =>
        api.get(`/crm/lists/${id}/contacts`, { params }),
    addToList: (listId: IdParam, contactIds: number[]) =>
        api.post(`/crm/lists/${listId}/add`, { contact_ids: contactIds }),
    removeFromList: (listId: IdParam, contactIds: number[]) =>
        api.post(`/crm/lists/${listId}/remove`, { contact_ids: contactIds }),

    // Faz 3: Timeline + Activity backfill
    getContactTimeline: (contactId: IdParam, params?: { limit?: number; before_id?: number; type?: string }) =>
        api.get(`/crm/contacts/${contactId}/timeline`, { params }),
    runActivityBackfill: () => api.post('/crm/activity-backfill', {}),

    // Faz 4: Scoring rules + history + email tracking
    listScoringRules: () => api.get('/crm/scoring-rules'),
    upsertScoringRule: (data: ApiPayload) => api.post('/crm/scoring-rules', data),
    updateScoringRule: (id: IdParam, data: ApiPayload) => api.put(`/crm/scoring-rules/${id}`, data),
    deleteScoringRule: (id: IdParam) => api.delete(`/crm/scoring-rules/${id}`),
    getScoreHistory: (contactId: IdParam) => api.get(`/crm/contacts/${contactId}/score-history`),
    recomputeScore: (contactId: IdParam) => api.post(`/crm/contacts/${contactId}/recompute-score`, {}),
    getContactEmailTracking: (contactId: IdParam) => api.get(`/crm/contacts/${contactId}/email-tracking`),
    listEmailTracking: (params?: { limit?: number; event?: string }) => api.get('/crm/email-tracking', { params }),

    // Faz 5: Web tracking + Smart links
    getContactWebVisits: (contactId: IdParam) => api.get(`/crm/contacts/${contactId}/web-visits`),
    listSmartLinks: () => api.get('/crm/smart-links'),
    getSmartLinkClicks: (id: IdParam) => api.get(`/crm/smart-links/${id}`),
    createSmartLink: (data: { slug?: string; target_url: string; label?: string }) => api.post('/crm/smart-links', data),
    updateSmartLink: (id: IdParam, data: ApiPayload) => api.put(`/crm/smart-links/${id}`, data),
    deleteSmartLink: (id: IdParam) => api.delete(`/crm/smart-links/${id}`),

    // Faz 6: Campaigns + A/B
    listCampaigns: () => api.get('/crm/campaigns'),
    getCampaign: (id: IdParam) => api.get(`/crm/campaigns/${id}`),
    createCampaign: (data: ApiPayload) => api.post('/crm/campaigns', data),
    updateCampaign: (id: IdParam, data: ApiPayload) => api.put(`/crm/campaigns/${id}`, data),
    deleteCampaign: (id: IdParam) => api.delete(`/crm/campaigns/${id}`),
    previewCampaignAudience: (data: { target_list_ids?: number[]; target_tag_slugs?: string[]; target_status?: string }) =>
        api.post('/crm/campaigns/preview', data),
    sendCampaign: (id: IdParam, dryRun = false) =>
        api.post(`/crm/campaigns/${id}/send`, { dry_run: dryRun }),
    scheduleCampaign: (id: IdParam, scheduledAt: string) =>
        api.post(`/crm/campaigns/${id}/schedule`, { scheduled_at: scheduledAt }),
    cancelCampaignSchedule: (id: IdParam) =>
        api.post(`/crm/campaigns/${id}/cancel-schedule`, {}),
    pauseCampaign: (id: IdParam) =>
        api.post(`/crm/campaigns/${id}/pause`, {}),
    resumeCampaign: (id: IdParam) =>
        api.post(`/crm/campaigns/${id}/resume`, {}),

    // Otomasyon test simülatörü
    listAutomationScenarios: () => api.get('/automation/scenarios'),
    runAutomationTest: (data: { email: string; scenario: string; mode?: 'preview' | 'live'; first_name?: string; last_name?: string }) =>
        api.post('/automation/run', data),
    dispatchCampaignBatch: (id: IdParam, batchSize = 50) =>
        api.post(`/crm/campaigns/${id}/dispatch-batch`, { batch_size: batchSize }),
    createOpenersList: (id: IdParam) =>
        api.post(`/crm/campaigns/${id}/openers-list`, {}),
    getCampaignReport: (id: IdParam) => api.get(`/crm/campaigns/${id}/report`),
    getCampaignRecipients: (id: IdParam) => api.get(`/crm/campaigns/${id}/recipients`),
    getCampaignListBreakdown: (id: IdParam) => api.get(`/crm/campaigns/${id}/list-breakdown`),
    getCampaignTopLinks: (id: IdParam) => api.get(`/crm/campaigns/${id}/top-links`),
    getCampaignTimeAnalysis: (id: IdParam) => api.get(`/crm/campaigns/${id}/time-analysis`),
    getCampaignAnalytics: () => api.get('/crm/campaign-analytics'),

    // Faz 7: Forms
    listForms: () => api.get('/crm/forms'),
    getForm: (id: IdParam) => api.get(`/crm/forms/${id}`),
    createForm: (data: ApiPayload) => api.post('/crm/forms', data),
    updateForm: (id: IdParam, data: ApiPayload) => api.put(`/crm/forms/${id}`, data),
    deleteForm: (id: IdParam) => api.delete(`/crm/forms/${id}`),
    getFormSubmissions: (id: IdParam) => api.get(`/crm/forms/${id}/submissions`),

    // Faz 8: CSV import/export
    csvPreview: (csv: string) => api.post('/crm/csv-preview', { csv }),
    csvImport: (data: { csv: string; mapping: Record<string, number>; tag_slugs?: string[]; list_ids?: number[]; status?: string; source?: string; update_existing?: boolean }) =>
        api.post('/crm/csv-import', data),
    csvExportUrl: (params?: { status?: string; tag_slug?: string; list_id?: number; min_score?: number }) => {
        const sp = new URLSearchParams();
        if (params?.status) sp.set('status', params.status);
        if (params?.tag_slug) sp.set('tag_slug', params.tag_slug);
        if (params?.list_id) sp.set('list_id', String(params.list_id));
        if (params?.min_score) sp.set('min_score', String(params.min_score));
        const qs = sp.toString();
        return `${API_BASE_URL}/crm/csv-export${qs ? '?' + qs : ''}`;
    },

    // Faz 9: Dashboard + Funnels
    getDashboard: (growthDays = 30) => api.get('/crm/dashboard', { params: { growth_days: growthDays } }),
    listFunnels: () => api.get('/crm/funnels'),
    getFunnel: (id: IdParam) => api.get(`/crm/funnels/${id}`),
    createFunnel: (data: ApiPayload) => api.post('/crm/funnels', data),
    updateFunnel: (id: IdParam, data: ApiPayload) => api.put(`/crm/funnels/${id}`, data),
    deleteFunnel: (id: IdParam) => api.delete(`/crm/funnels/${id}`),
    computeFunnel: (id: IdParam, rangeDays = 30) => api.get(`/crm/funnels/${id}/compute`, { params: { range_days: rangeDays } }),
    previewFunnel: (steps: any[], rangeDays = 30) => api.post('/crm/funnels/preview', { steps, range_days: rangeDays })
};

export interface CrmFunnelStep {
    type: 'tag' | 'list' | 'event' | 'status' | 'min_score';
    value: string | number;
    label?: string;
}

export interface CrmFunnel {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    steps: CrmFunnelStep[];
    is_active: boolean;
    created_at: string;
}

export interface CrmFormField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'hidden';
    placeholder?: string;
    required?: boolean;
    options?: string[];
    default_value?: string;
}
export interface CrmFormAction {
    type: 'add_tag' | 'add_to_list' | 'trigger_automation';
    tag_slug?: string;
    list_id?: number;
    automation_id?: number;
}
export interface CrmForm {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    fields: CrmFormField[];
    actions: CrmFormAction[];
    success_message: string | null;
    success_redirect: string | null;
    double_opt_in: boolean;
    opt_in_subject?: string | null;
    opt_in_body?: string | null;
    opt_in_redirect?: string | null;
    submission_count: number;
    is_active: boolean;
    created_at: string;
}

export interface CrmWebVisit {
    id: number;
    url: string;
    path: string | null;
    title: string | null;
    referrer: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    duration_seconds: number | null;
    occurred_at: string;
}

export interface CrmSmartLink {
    id: number;
    slug: string;
    target_url: string;
    label: string | null;
    campaign_id: number | null;
    click_count: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

export interface CrmCampaign {
    id: number;
    name: string;
    description: string | null;
    template_id?: number | null;
    from_email?: string | null;
    from_name?: string | null;
    subject: string;
    preview_text?: string | null;
    body_html?: string | null;
    design_json?: string | null;
    target_list_ids: number[];
    target_tag_slugs: string[];
    target_status: string;
    ab_enabled: boolean;
    ab_subject_b?: string | null;
    ab_winner_after_hours?: number;
    ab_winner?: string | null;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
    scheduled_at: string | null;
    started_at?: string | null;
    completed_at: string | null;
    stats: Record<string, unknown> | null;
    created_at: string;
    updated_at?: string;
}

export interface CrmCampaignReport {
    total: number;
    sent: number;
    failed: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
    variant_a: { sent: number; opened: number; open_rate: number };
    variant_b: { sent: number; opened: number; open_rate: number };
}

export interface CrmScoreRule {
    id: number;
    rule_key: string;
    label: string;
    event_type: string;
    points: number;
    decay_days: number;
    is_active: boolean;
}

export interface CrmScoreHistoryItem {
    id: number;
    rule_key: string | null;
    delta: number;
    score_after: number;
    reason: string | null;
    ref_type: string | null;
    ref_id: number | null;
    created_at: string;
}

export interface CrmActivityEvent {
    id: number;
    type: string;
    title: string;
    ref_type: string | null;
    ref_id: number | null;
    metadata: Record<string, unknown> | null;
    occurred_at: string;
}

export default api;
