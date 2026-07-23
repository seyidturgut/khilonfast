/* khilonfast — Exit Intent Popup (paylaşımlı)
   Kullanım: LP'lerde <script defer src="/exit-popup.js"></script>
   AÇ/KAPA: CRM → Forms → "Exit Popup" formu pasif yapılırsa popup HİÇ gösterilmez. */
(function(){
  var SLUG = 'exit-popup';
  var META = '/api/crm-public/form/' + SLUG;
  var ENDPOINT = '/api/crm-public/form/' + SLUG + '/submit';
  var SEEN_KEY = 'khilonExitPopupSeen';

  // Popup'ın gösterilmeyeceği hassas sayfalar (ödeme, giriş, panel, admin, onboarding...)
  var EXCLUDE = /(^|\/)(admin|dashboard|checkout|odeme|payment|payment-callback|payment-success|giris|login|kayit-ol|register|sifre-belirle|set-password|hesabim|onboarding|onboarding-sunumu|onboarding-formu|egitimllerim|abonelikten-cik|unsubscribe|danismanlik-odeme|danismanlik-basvurusu-odeme)(\/|$|-)/i;
  function blocked(){ return EXCLUDE.test(location.pathname); }

  try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch(e){}

  // Form aktif mi? (admin pasif yaptıysa 404 → hiç gösterme)
  fetch(META, {headers:{'Accept':'application/json'}})
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(cfg){ if(cfg && cfg.slug === SLUG) init(); })
    .catch(function(){});

  function init(){
    injectCss();
    var ov = build();
    var shown = false;

    function open(){
      if (shown || blocked()) return; shown = true;
      try { sessionStorage.setItem(SEEN_KEY, '1'); } catch(e){}
      ov.classList.add('on');
      document.documentElement.style.overflow = 'hidden';
    }
    function close(){
      ov.classList.remove('on');
      document.documentElement.style.overflow = '';
    }
    ov.__open = open; ov.__close = close;

    // Masaüstü: imleç viewport'un üstünden çıkarsa (çıkış niyeti)
    document.addEventListener('mouseout', function(e){
      if (!e.relatedTarget && e.clientY <= 0) open();
    });
    // Dokunmatik / mobil: geri tuşu niyeti + zaman aşımı yedeği
    var mobile = matchMedia('(hover: none)').matches || /Mobi|Android/i.test(navigator.userAgent);
    if (mobile){
      try {
        history.pushState({kExit:1}, '', location.href);
        window.addEventListener('popstate', function(){
          if (!shown){ open(); try { history.pushState({kExit:1},'',location.href); } catch(e){} }
        });
      } catch(e){}
      setTimeout(function(){ open(); }, 25000);
    }

    // Kapatma etkileşimleri
    ov.addEventListener('click', function(e){ if (e.target === ov) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
  }

  function build(){
    var wrap = document.createElement('div');
    wrap.className = 'kexit-ov';
    wrap.innerHTML =
      '<div class="kexit" role="dialog" aria-modal="true" aria-label="Detaylı bilgi formu">' +
        '<button class="kexit-x" type="button" aria-label="Kapat">&times;</button>' +
        '<div class="kexit-badge"><span></span>khilonfast</div>' +
        '<h3>Detaylı bilgi almak ister misiniz?</h3>' +
        '<p>Bilgilerinizi bırakın, ekibimiz size en kısa sürede ulaşsın.</p>' +
        '<form class="kexit-form" novalidate>' +
          '<div class="kexit-fld"><input type="text" name="name" autocomplete="name" maxlength="120" placeholder="Ad Soyad *"><div class="kexit-err">Bu alan zorunlu</div></div>' +
          '<div class="kexit-fld"><input type="email" name="email" autocomplete="email" maxlength="200" placeholder="E-posta *"><div class="kexit-err">Geçerli e-posta giriniz</div></div>' +
          '<div class="kexit-fld"><input type="tel" name="phone" autocomplete="tel" maxlength="40" placeholder="Telefon *"><div class="kexit-err">Zorunlu</div></div>' +
          '<label class="kexit-cons kexit-c1"><span class="kexit-box"><i>✓</i></span><span class="kexit-txt"><a href="https://khilonfast.com/gizlilik-politikasi" target="_blank" rel="noopener noreferrer">Gizlilik Politikası</a>&#39;nı okudum ve kabul ediyorum. *</span></label>' +
          '<div class="kexit-cerr">Devam etmek için gerekli</div>' +
          '<label class="kexit-cons kexit-c2"><span class="kexit-box"><i>✓</i></span><span class="kexit-txt">khilonfast&#39;tan e-posta, SMS ve telefon üzerinden pazarlama iletişimi almayı kabul ediyorum.</span></label>' +
          '<div class="kexit-hp"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>' +
          '<button type="submit" class="kexit-btn">Gönder →</button>' +
          '<div class="kexit-msg"></div>' +
        '</form>' +
        '<div class="kexit-ok"><div class="kexit-tick">✓</div><h3>Teşekkürler!</h3><p>Bilgileriniz alındı, en kısa sürede size dönüş yapacağız.</p></div>' +
      '</div>';
    document.body.appendChild(wrap);

    var form = wrap.querySelector('.kexit-form');
    var okBox = wrap.querySelector('.kexit-ok');
    var msg = wrap.querySelector('.kexit-msg');
    var btn = wrap.querySelector('.kexit-btn');
    var c1 = wrap.querySelector('.kexit-c1'), c2 = wrap.querySelector('.kexit-c2');
    var st = { c1:false, c2:false };
    var emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

    wrap.querySelector('.kexit-x').addEventListener('click', function(){ wrap.__close(); });
    c1.addEventListener('click', function(e){ e.preventDefault(); st.c1=!st.c1; c1.classList.toggle('on',st.c1); if(st.c1) wrap.querySelector('.kexit-cerr').classList.remove('show'); });
    c2.addEventListener('click', function(e){ e.preventDefault(); st.c2=!st.c2; c2.classList.toggle('on',st.c2); });

    function fld(inp){ return inp.closest('.kexit-fld'); }
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.name.value.trim(), email = form.email.value.trim(), phone = form.phone.value.trim();
      var bN=!name, bE=!emailRe.test(email), bP=!phone, bC=!st.c1;
      fld(form.name).classList.toggle('bad',bN); fld(form.email).classList.toggle('bad',bE); fld(form.phone).classList.toggle('bad',bP);
      wrap.querySelector('.kexit-cerr').classList.toggle('show',bC);
      if (bN||bE||bP||bC){ msg.textContent=''; return; }
      var payload = { first_name:name, email:email, phone:phone,
        source: location.pathname, kvkk:'Gizlilik Politikası onaylandı',
        etk: st.c2?'Onaylandı':'Reddedildi', website: form.website.value };
      var old = btn.textContent; btn.textContent='Gönderiliyor...'; btn.disabled=true;
      fetch(ENDPOINT, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){ return r.json().catch(function(){return{};}).then(function(d){return{ok:r.ok,d:d};}); })
        .then(function(res){
          if (res.ok && res.d && res.d.ok){
            if (window.gtag){ try { gtag('event','generate_lead',{form_id:'exit-popup',form_name:'Exit Popup'}); } catch(e){} }
            form.style.display='none'; okBox.classList.add('show');
          } else {
            msg.className='kexit-msg err'; msg.textContent=(res.d&&res.d.error)||'Bir hata oluştu, tekrar deneyin.';
            btn.textContent=old; btn.disabled=false;
          }
        })
        .catch(function(){ msg.className='kexit-msg err'; msg.textContent='Bağlantı hatası, tekrar deneyin.'; btn.textContent=old; btn.disabled=false; });
    });
    return wrap;
  }

  function injectCss(){
    if (document.getElementById('kexit-css')) return;
    var s = document.createElement('style'); s.id='kexit-css';
    s.textContent =
      '.kexit-ov{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:18px;'+
        'background:rgba(18,19,22,.62);backdrop-filter:blur(3px);font-family:Manrope,system-ui,-apple-system,sans-serif}'+
      '.kexit-ov.on{display:flex;animation:kexitfade .2s ease}'+
      '@keyframes kexitfade{from{opacity:0}to{opacity:1}}'+
      '@keyframes kexitup{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}'+
      '@keyframes kexitpop{0%{transform:scale(.5);opacity:0}62%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}'+
      '.kexit{position:relative;width:100%;max-width:420px;background:#F4F2EC;border-radius:24px;padding:30px 26px 26px;'+
        'box-shadow:0 40px 90px -30px rgba(18,19,22,.6);animation:kexitup .3s ease;color:#121316}'+
      '.kexit-x{position:absolute;top:14px;right:16px;width:30px;height:30px;border:none;background:rgba(18,19,22,.06);'+
        'border-radius:9px;font-size:20px;line-height:1;color:#121316;cursor:pointer}'+
      '.kexit-x:hover{background:rgba(18,19,22,.11)}'+
      '.kexit-badge{display:inline-flex;align-items:center;gap:8px;font:600 10.5px "Space Grotesk",Manrope,sans-serif;'+
        'letter-spacing:.14em;text-transform:uppercase;color:#7a8f1e;margin-bottom:12px}'+
      '.kexit-badge span{width:8px;height:8px;border-radius:50%;background:#C7F24E;box-shadow:0 0 10px #C7F24E}'+
      '.kexit h3{font:600 23px/1.15 "Space Grotesk",Manrope,sans-serif;letter-spacing:-.02em;margin:0 0 8px}'+
      '.kexit p{font:400 14px/1.5 Manrope,sans-serif;color:#5a5a57;margin:0 0 18px}'+
      '.kexit-fld{margin-bottom:10px}'+
      '.kexit-fld input{width:100%;padding:13px 15px;border:1.5px solid rgba(18,19,22,.14);border-radius:13px;'+
        'background:#fff;font:500 15px Manrope,sans-serif;color:#121316;outline:none;transition:.15s}'+
      '.kexit-fld input:focus{border-color:#121316}'+
      '.kexit-fld.bad input{border-color:#e2a9a0}'+
      '.kexit-err{display:none;color:#c0392b;font:600 11px Manrope,sans-serif;margin-top:4px}'+
      '.kexit-fld.bad .kexit-err{display:block}'+
      '.kexit-cons{display:flex;gap:10px;cursor:pointer;margin-top:10px;align-items:flex-start}'+
      '.kexit-box{width:22px;height:22px;flex:none;margin-top:1px;border-radius:7px;border:1.5px solid rgba(18,19,22,.24);'+
        'background:#fff;display:flex;align-items:center;justify-content:center;font:800 12px "Space Grotesk",sans-serif;color:#121316;transition:.15s}'+
      '.kexit-box i{display:none;font-style:normal}'+
      '.kexit-cons.on .kexit-box{background:#C7F24E;border-color:#C7F24E}'+
      '.kexit-cons.on .kexit-box i{display:block}'+
      '.kexit-txt{font:500 12px/1.45 Manrope,sans-serif;color:#4a4a48}'+
      '.kexit-txt a{color:#121316;font-weight:700;text-decoration:underline}'+
      '.kexit-cerr{display:none;color:#c0392b;font:600 11px Manrope,sans-serif;margin:4px 0 0 32px}'+
      '.kexit-cerr.show{display:block}'+
      '.kexit-btn{width:100%;margin-top:16px;border:none;cursor:pointer;font:700 15px "Space Grotesk",Manrope,sans-serif;'+
        'color:#121316;background:#C7F24E;border-radius:14px;padding:15px;box-shadow:0 12px 26px -12px #C7F24E;transition:.15s}'+
      '.kexit-btn:hover{filter:brightness(.97)}.kexit-btn:disabled{opacity:.6;cursor:not-allowed}'+
      '.kexit-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}'+
      '.kexit-msg{margin-top:10px;font:600 13px Manrope,sans-serif;text-align:center}'+
      '.kexit-msg.err{color:#c0392b}'+
      '.kexit-ok{display:none;text-align:center;padding:8px 4px}'+
      '.kexit-ok.show{display:block;animation:kexitup .3s ease}'+
      '.kexit-tick{width:74px;height:74px;border-radius:50%;background:#C7F24E;color:#121316;display:flex;align-items:center;'+
        'justify-content:center;font:700 36px "Space Grotesk",sans-serif;margin:6px auto 16px;animation:kexitpop .5s cubic-bezier(.2,.8,.2,1)}';
    document.head.appendChild(s);
  }
})();
