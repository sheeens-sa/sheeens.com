(function(){
  var C = window.SHEEN_CONFIG || {};
  document.querySelectorAll("[data-cfg]").forEach(function(el){ var v=C[el.getAttribute("data-cfg")]; if(v) el.textContent=v; });
  document.querySelectorAll("[data-cfg-href]").forEach(function(a){
    var k=a.getAttribute("data-cfg-href"), v=C[k];
    if(k==="phoneTel"){ if(v){a.href="tel:"+v;} else {a.removeAttribute("href");} return; }
    if(k==="email"){ if(v) a.href="mailto:"+v; return; }
    if(v){ a.href=v; a.target="_blank"; a.rel="noopener"; a.classList.remove("is-soon"); var s=a.querySelector(".soon"); if(s) s.remove(); }
    else { a.classList.add("is-soon"); a.href="contact.html"; if(!a.querySelector(".soon")){ var t=document.createElement("span"); t.className="soon"; t.textContent="قريبًا"; a.appendChild(t);} }
  });
  var b=document.querySelector(".menu-btn"), n=document.querySelector(".nav");
  if(b&&n) b.addEventListener("click",function(){ var o=n.classList.toggle("open"); b.setAttribute("aria-expanded",o); });
  var f=document.querySelector("#contact-form");
  if(f) f.addEventListener("submit",function(e){ e.preventDefault();
    var d=new FormData(f), body="الاسم: "+(d.get("name")||"")+"\nالعلامة: "+(d.get("brand")||"")+"\n\n"+(d.get("msg")||"");
    location.href="mailto:"+(C.email||"")+"?subject="+encodeURIComponent("طلب من موقع شين")+"&body="+encodeURIComponent(body); });
})();
