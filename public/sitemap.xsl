<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:html="http://www.w3.org/TR/REC-html40"
    xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="tr">
      <head>
        <title>XML Sitemap | khilonfast</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex,follow"/>
        <style type="text/css">
          html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e3a5f; }
          body { margin: 0; padding: 0; background: #f8fafc; }
          .header { background: #1e3a5f; color: #fff; padding: 32px 24px; }
          .header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.01em; }
          .header p { margin: 0; opacity: .85; font-size: 14px; line-height: 1.6; }
          .header a { color: #93c5fd; text-decoration: underline; }
          .wrap { max-width: 1280px; margin: 0 auto; padding: 24px; }
          .info { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 22px; margin-bottom: 20px; font-size: 13px; line-height: 1.7; color: #334155; }
          .info strong { color: #1e3a5f; }
          table { background: #fff; border-collapse: collapse; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
          th { background: #f1f5f9; text-align: left; padding: 14px 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
          td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #f8fafc; }
          td a { color: #2563eb; text-decoration: none; word-break: break-all; }
          td a:hover { text-decoration: underline; }
          .num { text-align: right; color: #64748b; width: 60px; font-variant-numeric: tabular-nums; }
          .meta { color: #64748b; font-size: 13px; font-variant-numeric: tabular-nums; }
          .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
          .badge.high { background: #fef3c7; color: #92400e; }
          .badge.med { background: #e0f2fe; color: #0c4a6e; }
          .footer { margin-top: 32px; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
          .footer a { color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="wrap" style="padding: 0;">
            <h1>XML Sitemap</h1>
            <p>
              Bu bir <strong>XML sitemap</strong> dosyasıdır ve arama motorlarının (Google, Bing vb.) sitenizi keşfetmesine yardımcı olur.
              Sitemap hakkında daha fazla bilgi için <a href="https://www.sitemaps.org/" target="_blank" rel="noopener">sitemaps.org</a> adresini ziyaret edebilirsiniz.
            </p>
          </div>
        </div>
        <div class="wrap">
          <xsl:choose>
            <xsl:when test="count(sitemap:sitemapindex/sitemap:sitemap) &gt; 0">
              <div class="info">
                <strong>Sitemap Index</strong> — bu dosya <strong><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></strong> alt sitemap içerir. Her bir sitemap belirli bir içerik kategorisini (sayfalar, hizmetler, sektörel sayfalar, ürünler, eğitimler, vb.) listeler.
              </div>
              <table>
                <thead>
                  <tr>
                    <th class="num">#</th>
                    <th>Sitemap URL</th>
                    <th style="width: 180px;">Son Güncelleme</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                    <tr>
                      <td class="num"><xsl:value-of select="position()"/></td>
                      <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                      <td class="meta"><xsl:value-of select="sitemap:lastmod"/></td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <div class="info">
                <strong>URL Sitemap</strong> — bu dosya <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> URL içerir. Arama motorları bu liste üzerinden sayfaları indekslemek için tarar.
              </div>
              <table>
                <thead>
                  <tr>
                    <th class="num">#</th>
                    <th>URL</th>
                    <th style="width: 140px;">Son Güncelleme</th>
                    <th style="width: 110px;">Sıklık</th>
                    <th style="width: 110px;">Öncelik</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <tr>
                      <td class="num"><xsl:value-of select="position()"/></td>
                      <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                      <td class="meta"><xsl:value-of select="sitemap:lastmod"/></td>
                      <td class="meta"><xsl:value-of select="sitemap:changefreq"/></td>
                      <td>
                        <xsl:variable name="p" select="sitemap:priority"/>
                        <xsl:choose>
                          <xsl:when test="$p &gt;= 0.9">
                            <span class="badge high"><xsl:value-of select="$p"/></span>
                          </xsl:when>
                          <xsl:when test="$p &gt;= 0.6">
                            <span class="badge"><xsl:value-of select="$p"/></span>
                          </xsl:when>
                          <xsl:otherwise>
                            <span class="badge med"><xsl:value-of select="$p"/></span>
                          </xsl:otherwise>
                        </xsl:choose>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
          <div class="footer">
            <a href="https://khilonfast.com">khilonfast.com</a> · Otomatik üretilmiş XML sitemap
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
