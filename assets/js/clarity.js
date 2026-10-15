/* Microsoft Clarity (heatmaps + session recordings) for julia.loopnpd.com (2026-10-15).
 *
 * Same gate as the LoopNPD sales site (PD-App sales-site/assets/js/ad-tracking.js):
 *   - Global Privacy Control or the opt-out cookie `jt_analytics_optout=1` keeps
 *     Clarity off, always;
 *   - UK/EU time zones see a cookie banner and nothing loads until "Accept all"
 *     (cookie `jt_consent=granted`). GPC and the opt-out still win over an Accept.
 * Cookies here are host-only: a choice made on loopnpd.com does not carry over,
 * because that banner asks about different things.
 *
 * Empty project id = Clarity loads nothing.
 */
;(function () {
  'use strict'

  var CLARITY_PROJECT_ID = 'yyaw6nviwm'

  var OPT_OUT_COOKIE = 'jt_analytics_optout'
  var CONSENT_COOKIE = 'jt_consent' // 'granted' | 'denied'; consent-zone visitors only
  var CONSENT_MAX_AGE = 180 * 24 * 60 * 60
  var OPT_OUT_MAX_AGE = 365 * 24 * 60 * 60
  var CLARITY_COOKIE_PREFIXES = ['_clck', '_clsk']
  var CONSENT_ZONES = [
    'Atlantic/Azores',
    'Atlantic/Canary',
    'Atlantic/Faroe',
    'Atlantic/Madeira',
    'Atlantic/Reykjavik',
    'Arctic/Longyearbyen',
    'Asia/Famagusta',
    'Asia/Nicosia',
    'America/Cayenne',
    'America/Guadeloupe',
    'America/Martinique',
    'Indian/Mayotte',
    'Indian/Reunion',
    'GB',
    'GB-Eire',
    'Eire',
  ]

  function readCookie(name) {
    var parts = document.cookie.split(';')
    for (var i = 0; i < parts.length; i++) {
      var eq = parts[i].indexOf('=')
      if (eq < 0) continue
      if (parts[i].slice(0, eq).trim() === name) return parts[i].slice(eq + 1).trim()
    }
    return undefined
  }

  function setCookie(name, value, maxAge) {
    document.cookie =
      name +
      '=' +
      value +
      '; Max-Age=' +
      maxAge +
      '; Path=/; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '')
  }

  function consentRequiredTimeZone() {
    var tz = null
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (e) {
      return false
    }
    if (!tz) return false
    return tz.indexOf('Europe/') === 0 || CONSENT_ZONES.indexOf(tz) >= 0
  }

  function optedOut() {
    return navigator.globalPrivacyControl === true || readCookie(OPT_OUT_COOKIE) === '1'
  }

  function consentChoice() {
    var v = readCookie(CONSENT_COOKIE)
    return v === 'granted' || v === 'denied' ? v : null
  }

  function allowed() {
    if (optedOut()) return false
    return !consentRequiredTimeZone() || consentChoice() === 'granted'
  }

  var started = false

  function initClarity() {
    if (started) return
    started = true
    if (!/^[a-z0-9]{6,20}$/.test(CLARITY_PROJECT_ID)) return
    window.clarity =
      window.clarity ||
      function () {
        ;(window.clarity.q = window.clarity.q || []).push(arguments)
      }
    var s = document.createElement('script')
    s.async = true
    s.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(CLARITY_PROJECT_ID)
    document.head.appendChild(s)
  }

  function clearClarityCookies() {
    var parts = document.cookie.split(';')
    for (var i = 0; i < parts.length; i++) {
      var name = parts[i].split('=')[0].trim()
      for (var j = 0; j < CLARITY_COOKIE_PREFIXES.length; j++) {
        if (name.indexOf(CLARITY_COOKIE_PREFIXES[j]) !== 0) continue
        var gone = name + '=; Max-Age=0; Path=/'
        document.cookie = gone
        document.cookie = gone + '; Domain=' + location.hostname
        document.cookie = gone + '; Domain=.loopnpd.com'
        break
      }
    }
  }

  // "Opt out" links: <a data-jt-optout href="#">…</a>
  function wireOptOutLinks() {
    var links = document.querySelectorAll('[data-jt-optout]')
    for (var i = 0; i < links.length; i++) {
      if (optedOut()) links[i].textContent = 'You have opted out'
      links[i].addEventListener('click', function (e) {
        e.preventDefault()
        if (optedOut()) return
        setCookie(OPT_OUT_COOKIE, '1', OPT_OUT_MAX_AGE)
        clearClarityCookies()
        location.reload()
      })
    }
  }

  // ── Cookie banner (consent-zone visitors only) ──────────────────────────────
  // "Accept all" and "Reject all" look the same and sit side by side: neither is
  // easier to pick. Nothing loads until "Accept all" is clicked.
  var banner = null

  function injectStyles() {
    if (document.getElementById('jt-consent-css')) return
    var css =
      '.jt-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:1000;max-width:720px;margin:0 auto;' +
      'background:#F2EDE3;color:#041634;border:3px solid #041634;box-shadow:8px 8px 0 #0B3DB5;' +
      'font-family:"Cabin","Segoe UI",system-ui,sans-serif;font-size:15px;line-height:1.45;padding:16px 18px;' +
      'display:grid;gap:12px}' +
      '.jt-consent p{margin:0}' +
      '.jt-consent a{color:#0B3DB5}' +
      '.jt-consent__actions{display:flex;flex-wrap:wrap;gap:12px}' +
      '.jt-consent__btn{font:600 14px "Inter","Segoe UI",system-ui,sans-serif;letter-spacing:.04em;' +
      'text-transform:uppercase;padding:10px 18px;min-width:140px;cursor:pointer;' +
      'background:#041634;color:#F2EDE3;border:2px solid #041634}' +
      '.jt-consent__btn:hover,.jt-consent__btn:focus-visible{background:#0B3DB5;border-color:#0B3DB5}' +
      '.jt-privacy{background:#041634;color:#F2EDE3;font-family:"Cabin","Segoe UI",system-ui,sans-serif;' +
      'font-size:13px;line-height:1.5;padding:18px 16px 22px;text-align:center}' +
      '.jt-privacy p{margin:0 auto;max-width:72ch;opacity:.85}' +
      '.jt-privacy a{color:#F2EDE3}'
    var style = document.createElement('style')
    style.id = 'jt-consent-css'
    style.textContent = css
    document.head.appendChild(style)
  }

  function choose(choice) {
    var before = consentChoice()
    setCookie(CONSENT_COOKIE, choice, CONSENT_MAX_AGE)
    hideBanner()
    if (choice === 'granted') {
      if (allowed()) initClarity()
    } else if (started || before === 'granted') {
      // Withdrawing consent: drop Clarity's cookies and reload so its script is gone.
      clearClarityCookies()
      location.reload()
    }
  }

  function hideBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner)
    banner = null
  }

  function showBanner() {
    if (banner || !document.body) return
    injectStyles()
    banner = document.createElement('div')
    banner.className = 'jt-consent'
    banner.setAttribute('role', 'region')
    banner.setAttribute('aria-label', 'Cookie choices')
    banner.innerHTML =
      '<p>I would like to use Microsoft Clarity to see how visitors use this site, through heatmaps and ' +
      'session recordings. It sets cookies and stays off unless you accept. You can change your choice any ' +
      'time with "Cookie settings" at the bottom of the page. ' +
      '<a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener">Microsoft Privacy Statement</a></p>' +
      '<div class="jt-consent__actions">' +
      '<button type="button" class="jt-consent__btn" data-consent="granted">Accept all</button>' +
      '<button type="button" class="jt-consent__btn" data-consent="denied">Reject all</button>' +
      '</div>'
    var buttons = banner.querySelectorAll('[data-consent]')
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e) {
        choose(e.currentTarget.getAttribute('data-consent'))
      })
    }
    document.body.appendChild(banner)
  }

  // "Cookie settings" links: <a data-jt-cookie-settings hidden>…</a>.
  // Shown only where a choice can matter (consent zone, no GPC / opt-out).
  function wireCookieSettingsLinks() {
    var links = document.querySelectorAll('[data-jt-cookie-settings]')
    var relevant = consentRequiredTimeZone() && !optedOut()
    for (var i = 0; i < links.length; i++) {
      if (!relevant) continue
      links[i].hidden = false
      links[i].removeAttribute('hidden')
      links[i].addEventListener('click', function (e) {
        e.preventDefault()
        showBanner()
      })
    }
  }

  function initUi() {
    injectStyles()
    wireOptOutLinks()
    if (consentRequiredTimeZone() && !optedOut() && consentChoice() === null) showBanner()
    wireCookieSettingsLinks()
  }

  if (allowed()) initClarity()
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi)
  else initUi()
})()
