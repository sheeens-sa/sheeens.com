(function(){
  "use strict";
  var C = window.SHEEN_CONFIG || {services:{}};
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

  // الترويسة اللاصقة + القائمة في الجوال
  var hdr = $(".hdr");
  var onScroll = function(){ if(hdr) hdr.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
  var mb = $(".menu-btn");
  if(mb) mb.addEventListener("click", function(){
    var open = document.body.classList.toggle("menu-open");
    mb.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // ظهور تدريجي
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }); }, {rootMargin:"0px 0px -8% 0px"});
    $$(".reveal").forEach(function(el){ io.observe(el); });
  } else { $$(".reveal").forEach(function(el){ el.classList.add("in"); }); }

  // الجهات: الشريط وبطاقات الأعمال اللي تحمل اسم جهة (تحتاج تأكيد فيصل)
  $$("[data-clients]").forEach(function(el){ el.hidden = !C.showClients; });
  $$("[data-client]").forEach(function(el){ el.hidden = !C.showClients; });

  // الفيديو التعريفي: يُحمَّل فقط عند الاقتراب منه، نسخة للجوال ونسخة للشاشات العريضة
  var vfig = $("[data-video]");
  if(vfig && C.showIntroVideo === false){ var vs = vfig.closest("section"); if(vs) vs.hidden = true; vfig = null; }
  if(vfig){
    var v = vfig.querySelector("video"), sb = vfig.querySelector("[data-sound]");
    var mq = window.matchMedia("(max-width:700px)");
    var reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var kind = function(){ return mq.matches ? "mobile" : "desktop"; };
    var loaded = "";
    v.poster = v.getAttribute("data-poster-" + kind());
    var load = function(){
      var k = kind(); if(loaded === k) return; loaded = k;
      v.poster = v.getAttribute("data-poster-" + k);
      v.src = v.getAttribute("data-src-" + k); v.load();
      if(reduce){ v.controls = true; } else { var pr = v.play(); if(pr && pr.catch) pr.catch(function(){ v.controls = true; }); }
    };
    if("IntersectionObserver" in window){
      var vio = new IntersectionObserver(function(es){ es.forEach(function(e){
        if(e.isIntersecting){ load(); if(!reduce && v.paused && loaded) { var p2 = v.play(); if(p2 && p2.catch) p2.catch(function(){}); } }
        else if(loaded && !v.paused){ v.pause(); }
      }); }, {rootMargin:"200px 0px"});
      vio.observe(vfig);
    } else { load(); }
    if(mq.addEventListener) mq.addEventListener("change", function(){ if(loaded) load(); else v.poster = v.getAttribute("data-poster-" + kind()); });
    if(sb) sb.addEventListener("click", function(){
      v.muted = !v.muted; sb.setAttribute("aria-pressed", v.muted ? "false" : "true");
      if(!v.muted){ if(!loaded) load(); v.play(); }
    });
  }

  // روابط القنوات من الإعدادات
  function waUrl(text){ return "https://wa.me/" + C.whatsapp + (text ? "?text=" + encodeURIComponent(text) : ""); }
  function tgUrl(){ return "https://t.me/" + C.telegram; }
  $$("[data-channel]").forEach(function(el){
    var ch = el.getAttribute("data-channel"), url = "";
    if(ch === "email" && C.email){ url = "mailto:" + C.email; }
    if(ch === "whatsapp" && C.whatsapp){ url = waUrl(""); }
    if(ch === "telegram" && C.telegram){ url = tgUrl(); }
    if(url){ el.setAttribute("href", url); if(ch !== "email"){ el.target = "_blank"; el.rel = "noopener"; } return; }
    if(C.showPlaceholders){ el.classList.add("is-soon"); el.removeAttribute("href"); el.setAttribute("aria-disabled","true"); var s = el.querySelector("[data-soon]"); if(s) s.textContent = "قريبًا"; }
    else { el.hidden = true; }
  });
  $$("[data-email-text]").forEach(function(el){ el.textContent = C.email || ""; });

  // أزرار الدفع: تظهر فقط للخدمات اللي لها رابط ستريم
  $$("[data-service]").forEach(function(card){
    var id = card.getAttribute("data-service"), svc = C.services[id];
    var slot = card.querySelector("[data-pay-slot]");
    if(!slot || !svc || !svc.streamLink) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-pay btn-sm"; b.setAttribute("data-pay", id);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M7 15h3"/></svg>' + (svc.payLabel || "ادفع الآن");
    slot.appendChild(b);
  });

  var dlg = $("#pay-dlg"), sdkLoading = null;
  function loadSdk(){
    if(window.Stream && window.Stream.Checkout) return Promise.resolve();
    if(sdkLoading) return sdkLoading;
    sdkLoading = new Promise(function(res, rej){ var s = document.createElement("script"); s.src = C.stream.sdk; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
    return sdkLoading;
  }
  document.addEventListener("click", function(e){
    var b = e.target.closest && e.target.closest("[data-pay]"); if(!b) return;
    var svc = C.services[b.getAttribute("data-pay")]; if(!svc || !svc.streamLink) return;
    if(C.stream.mode !== "embed" || !dlg || typeof dlg.showModal !== "function"){ window.location.href = svc.streamLink; return; }
    $("#pay-title").textContent = "الدفع: " + svc.name;
    var box = $("#stream-checkout"); box.innerHTML = "";
    dlg.showModal();
    loadSdk().then(function(){ window.Stream.Checkout({ paymentLink: svc.streamLink, container: "#stream-checkout" }); })
             .catch(function(){ window.location.href = svc.streamLink; });
  });
  if(dlg){ $$("[data-close]", dlg).forEach(function(x){ x.addEventListener("click", function(){ dlg.close(); }); }); }

  // فلترة الأعمال
  var fbtns = $$(".filters button");
  fbtns.forEach(function(btn){ btn.addEventListener("click", function(){
    var f = btn.getAttribute("data-filter");
    fbtns.forEach(function(x){ x.setAttribute("aria-pressed", x === btn ? "true" : "false"); });
    $$(".work").forEach(function(w){ w.hidden = !(f === "all" || w.getAttribute("data-cat") === f); });
  }); });

  // نموذج الطلب: يبني رسالة جاهزة ويرسلها بالقناة المختارة (بدون خادم)
  var form = $("#order-form");
  if(form){
    var sel = form.querySelector("#f-service");
    var q = new URLSearchParams(location.search).get("service");
    if(q && sel.querySelector('option[value="'+q+'"]')) sel.value = q;
    // تعطيل القنوات غير المربوطة
    $$('input[name="channel"]', form).forEach(function(r){
      var ok = (r.value === "email" && C.email) || (r.value === "whatsapp" && C.whatsapp) || (r.value === "telegram" && C.telegram);
      if(!ok){ r.disabled = true; var t = r.parentNode.querySelector("[data-soon]"); if(t) t.textContent = "قريبًا"; }
    });
    var toast = $("#toast");
    function say(msg){ if(!toast) return; toast.textContent = msg; toast.classList.add("show"); setTimeout(function(){ toast.classList.remove("show"); }, 4200); }
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var ok = true;
      ["f-name","f-service","f-details"].forEach(function(id){
        var el = form.querySelector("#"+id), fld = el.closest(".field"), bad = !el.value.trim();
        fld.classList.toggle("invalid", bad); if(bad && ok){ el.focus(); ok = false; }
      });
      if(!ok) return;
      var v = function(id){ return (form.querySelector("#"+id).value || "").trim(); };
      var svcName = sel.options[sel.selectedIndex].text;
      var lines = ["السلام عليكم، أرغب في طلب خدمة من شين لخدمات الأعمال.", "",
        "الاسم: " + v("f-name")];
      if(v("f-org")) lines.push("الجهة: " + v("f-org"));
      if(v("f-phone")) lines.push("الجوال: " + v("f-phone"));
      lines.push("الخدمة: " + svcName);
      if(v("f-when")) lines.push("الموعد المطلوب: " + v("f-when"));
      lines.push("", "التفاصيل:", v("f-details"));
      var text = lines.join("\n");
      var ch = (form.querySelector('input[name="channel"]:checked') || {}).value || "email";
      if(ch === "whatsapp" && C.whatsapp){ window.open(waUrl(text), "_blank", "noopener"); return; }
      if(ch === "telegram" && C.telegram){
        if(navigator.clipboard) navigator.clipboard.writeText(text).catch(function(){});
        say("نسخنا تفاصيل طلبك، الصقها في محادثة تيليجرام.");
        window.open(tgUrl(), "_blank", "noopener"); return;
      }
      window.location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent("طلب خدمة: " + svcName) + "&body=" + encodeURIComponent(text);
      say("فتحنا بريدك برسالة جاهزة، راجعها ثم أرسلها.");
    });
    $$("input,select,textarea", form).forEach(function(el){ el.addEventListener("input", function(){ var f = el.closest(".field"); if(f) f.classList.remove("invalid"); }); });
  }
})();
