/* =========================================================================
   PORTFOLIO / SCRIPT
   - GSAP intros, scroll triggers, marquee, drag-and-throw
   - Three.js shader background
   - Custom cursor with hover label
   - Mac finder folder filtering and project window
   - Twinkling background stars
   ========================================================================= */

gsap.registerPlugin(ScrollTrigger, Draggable);

/* ---------- preloader ---------- */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preload').classList.add('is-gone');
    runIntro();
  }, 900);
});

/* ---------- clock ---------- */
function tickClock(){
  const el = document.getElementById('clock');
  if (!el) return;
  const d = new Date();
  el.textContent = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}
setInterval(tickClock, 1000); tickClock();


/* ---------- background stars ---------- */
(() => {
  const wrap = document.getElementById('bgStars');
  if (!wrap) return;
  const count = 70;
  let html = '';
  for (let i = 0; i < count; i++){
    const x = (Math.random() * 100).toFixed(2);
    const y = (Math.random() * 100).toFixed(2);
    const s = (Math.random() * 2 + 1).toFixed(1);
    const dur = (Math.random() * 4 + 2).toFixed(2);
    const dl = (Math.random() * 5).toFixed(2);
    html += `<span style="left:${x}%; top:${y}%; width:${s}px; height:${s}px; --dur:${dur}s; --delay:${dl}s;"></span>`;
  }
  wrap.innerHTML = html;
})();


/* ---------- custom cursor with label ---------- */
(() => {
  const dot = document.getElementById('cdot');
  const ring = document.getElementById('cring');
  const label = document.getElementById('clabel');
  let mx = window.innerWidth/2, my = window.innerHeight/2;
  let rx = mx, ry = my;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  function loop(){
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const labelMap = {
    'hover': 'view',
    'drag':  'drag',
    'open':  'open'
  };

  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-cursor]');
    if (t){
      const kind = t.dataset.cursor;
      label.textContent = labelMap[kind] || 'view';
      document.body.classList.add('is-hover');
      document.body.classList.toggle('is-drag', kind === 'drag');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('[data-cursor]')){
      document.body.classList.remove('is-hover', 'is-drag');
    }
  });
  document.addEventListener('mousedown', () => document.body.classList.add('is-press'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('is-press'));
})();


/* ---------- WebGL breathing background ---------- */
(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

  const uniforms = {
    uTime: { value: 0 },
    uRes:  { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse:{ value: new THREE.Vector2(0.5, 0.5) },
    uScroll:{ value: 0 }
  };

  const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`;
  const frag = `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uRes;
    uniform vec2 uMouse;
    uniform float uScroll;

    vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
    vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
    vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }

    void main(){
      vec2 uv = vUv;
      float aspect = uRes.x / uRes.y;
      vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
      vec2 m = (uMouse - 0.5) * 0.15;
      float t = uTime * 0.06 + uScroll * 0.4;
      float breath = 0.92 + 0.08 * sin(uTime * 0.4);

      float n1 = snoise(vec3(p * 1.4 * breath + m, t)) * 0.5 + 0.5;
      float n2 = snoise(vec3(p * 2.6 - m, t * 0.7 + 17.0)) * 0.5 + 0.5;
      float n3 = snoise(vec3(p * 0.7, t * 0.4 + 31.0)) * 0.5 + 0.5;

      vec3 cream = vec3(0.965, 0.957, 0.953);
      vec3 mint  = vec3(0.745, 0.831, 0.760);
      vec3 sage  = vec3(0.482, 0.588, 0.478);
      vec3 brown = vec3(0.420, 0.251, 0.157);

      vec3 col = cream;
      col = mix(col, mint,  smoothstep(0.40, 0.92, n1) * 0.55);
      col = mix(col, sage,  smoothstep(0.62, 0.96, n2) * 0.22);
      col = mix(col, brown, smoothstep(0.74, 1.00, n3) * 0.06);

      float v = smoothstep(1.1, 0.2, length(p));
      col = mix(cream * 0.95, col, v);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const geo = new THREE.PlaneGeometry(2,2);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag });
  scene.add(new THREE.Mesh(geo, mat));

  function resize(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', e => {
    uniforms.uMouse.value.x = e.clientX / window.innerWidth;
    uniforms.uMouse.value.y = 1.0 - e.clientY / window.innerHeight;
  });
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    uniforms.uScroll.value = window.scrollY / Math.max(1, max);
  }, { passive: true });

  const start = performance.now();
  function tick(){
    uniforms.uTime.value = (performance.now() - start) / 1000;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();


/* ---------- droplets + star polygons drift ---------- */
(() => {
  document.querySelectorAll('.droplet').forEach((d, i) => {
    gsap.to(d, {
      x: gsap.utils.random(-90, 90),
      y: gsap.utils.random(-70, 70),
      scale: gsap.utils.random(.85, 1.15),
      duration: 18 + i * 4,
      repeat: -1, yoyo: true, ease: 'sine.inOut',
      delay: i * .6
    });
  });

  document.querySelectorAll('.starshape').forEach((s, i) => {
    gsap.to(s, {
      y: gsap.utils.random(-30, 30),
      x: gsap.utils.random(-20, 20),
      rotation: gsap.utils.random(-180, 180),
      duration: 14 + i * 2,
      repeat: -1, yoyo: true, ease: 'sine.inOut'
    });
  });
})();


/* ---------- intro reveal ---------- */
function runIntro(){
  // hero title slide-up
  gsap.to('.hero-title .word > span', {
    y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06
  });
  gsap.from(['.hero-eyebrow', '.hero-subline'], {
    y: 20, opacity: 0, duration: 1, ease: 'power3.out',
    stagger: 0.15, delay: 0.4
  });

  // hero stickers pop in with stagger
  gsap.from('.sticker', {
    y: 40, opacity: 0, scale: 0.92, rotate: '+=8',
    duration: 1.2, ease: 'power3.out',
    stagger: { each: 0.08, from: 'random' },
    delay: 0.6,
    clearProps: 'opacity,scale'
  });

  // scroll reveals
  gsap.utils.toArray('.reveal-fade').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // marquee loop
  const track = document.getElementById('marquee');
  if (track){
    const w = track.scrollWidth / 2;
    gsap.to(track, { x: -w, duration: 38, ease: 'none', repeat: -1 });
  }

  // hero parallax
  gsap.to('.hero-titlewrap', {
    yPercent: -10, scale: 0.96,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // folders staggered reveal
  gsap.fromTo('.folder-tile',
    { opacity: 0, y: 40 },
    {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.folders-grid', start: 'top 80%' }
    }
  );

  // about card subtle float
  gsap.to('.about-card', {
    y: -10, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true
  });

  // bulletin board staggered reveal
  gsap.fromTo('.pin-item',
    { opacity: 0, y: 30, scale: 0.94 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: 0.7, ease: 'back.out(1.5)',
      stagger: { each: 0.07, from: 'random' },
      scrollTrigger: { trigger: '#boardCork', start: 'top 80%' }
    }
  );

  // about photo fade in
  gsap.fromTo('.about-photo',
    { opacity: 0, scale: 0.97, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-photo-row', start: 'top 80%' }
    }
  );
}


/* ---------- bulletin board: static pins + wind ---------- */
(() => {
  const cork = document.getElementById('boardCork');
  if (!cork) return;
  const pins = [...cork.querySelectorAll('.pin-item')];

  // CSS left/top % handles position; GSAP owns rotation from data-rot
  pins.forEach(el => {
    const rot = parseFloat(el.dataset.rot ?? 0);
    gsap.set(el, { rotation: rot });
  });

  // Hover wind burst when cursor enters the board
  cork.addEventListener('mouseenter', () => {
    pins.forEach((el, i) => {
      const base    = parseFloat(el.dataset.rot ?? 0);
      const flutter = (Math.random() - 0.5) * 12;
      gsap.to(el, {
        rotation: base + flutter,
        duration: 0.3 + Math.random() * 0.25,
        ease: 'power2.out',
        onComplete() {
          gsap.to(el, { rotation: base, duration: 1.1, ease: 'elastic.out(1, 0.45)', delay: i * 0.025 });
        }
      });
    });
  });

  // Scroll-speed flutter
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const delta = window.scrollY - lastY;
    lastY = window.scrollY;
    if (Math.abs(delta) < 5) return;
    pins.forEach((el, i) => {
      const base = parseFloat(el.dataset.rot ?? 0);
      const kick = delta * 0.07 * (i % 2 === 0 ? 1 : -1);
      gsap.to(el, { rotation: base + kick, duration: 0.12, ease: 'none', overwrite: 'auto' });
      gsap.to(el, { rotation: base, duration: 1.4, ease: 'elastic.out(1, 0.35)', delay: 0.12, overwrite: false });
    });
  }, { passive: true });
})();


/* ---------- terminal interactive typing ---------- */
(() => {
  const termSticker = document.querySelector('.s-terminal');
  const termBody    = termSticker?.querySelector('.terminal-body');
  const termInput   = termSticker?.querySelector('.term-input');
  if (!termSticker || !termBody || !termInput) return;

  const CMDS = {
    'whoami':     'marketing & interactive design grad,\nbrisbane based, brown skin first',
    'ls work/':   'mirchi · sund · nestify · travel · newlyf · winnlane',
    'echo $vibe': '"diversity is the premise, not the footnote"',
    'help':       'try: whoami  /  ls work/  /  echo $vibe  /  clear',
    'clear':      '__clear__'
  };
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const updatePrompt = v => {
    termBody.lastElementChild.innerHTML = `<span class="pr">~ $</span> ${esc(v)}<span class="blink"></span>`;
  };

  termSticker.addEventListener('click', () => {
    termSticker.classList.add('is-active');
    termInput.style.pointerEvents = 'auto';
    termInput.focus();
    termInput.style.pointerEvents = 'none';
  });
  document.addEventListener('click', e => {
    if (!termSticker.contains(e.target)) termSticker.classList.remove('is-active');
  });
  termInput.addEventListener('input', () => updatePrompt(termInput.value));
  termInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const cmd = termInput.value.trim();
    const res = CMDS[cmd.toLowerCase()];
    const cmdEl = document.createElement('div');
    cmdEl.innerHTML = `<span class="pr">~ $</span> ${esc(cmd)}`;
    termBody.insertBefore(cmdEl, termBody.lastElementChild);
    if (res === '__clear__') {
      while (termBody.children.length > 1) termBody.removeChild(termBody.firstElementChild);
    } else {
      const outEl = document.createElement('div');
      outEl.className = 'out';
      outEl.textContent = res ?? `command not found: ${cmd}`;
      termBody.insertBefore(outEl, termBody.lastElementChild);
    }
    termInput.value = '';
    updatePrompt('');
  });
})();


/* ---------- finder filters ---------- */
(() => {
  const tags = document.querySelectorAll('.finder-side .item[data-filter]');
  const items = document.querySelectorAll('.folder-tile');
  let active = null;
  tags.forEach(t => {
    t.addEventListener('click', () => {
      const f = t.dataset.filter;
      // toggle off if same one clicked
      if (active === f){
        tags.forEach(x => x.classList.remove('is-active'));
        items.forEach(it => {
          gsap.to(it, { opacity: 1, scale: 1, duration: .4, ease: 'power3.out' });
          it.style.pointerEvents = 'auto';
        });
        active = null;
        return;
      }
      tags.forEach(x => x.classList.remove('is-active'));
      t.classList.add('is-active');
      active = f;
      items.forEach(it => {
        const show = it.dataset.cat === f;
        gsap.to(it, {
          opacity: show ? 1 : 0.18,
          scale: show ? 1 : 0.98,
          duration: 0.5, ease: 'power3.out'
        });
        it.style.pointerEvents = show ? 'auto' : 'none';
      });
    });
  });
})();


/* ---------- figure helper ---------- */
function fig(label, imgSrc='', accent='var(--c-mint)', contain=false){
  if (imgSrc) {
    return `<div class="proj-fig has-img${contain?' contain':''}" style="--fig-accent:${accent}">
      <img src="${imgSrc}" alt="${label}" loading="lazy">
    </div>`;
  }
  return `<div class="proj-fig" style="--fig-accent:${accent}; aspect-ratio:4/3;">
    <div class="proj-fig-inner">
      <svg class="proj-fig-stripe" viewBox="0 0 200 200" preserveAspectRatio="none"><defs><pattern id="sp" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="18" stroke="currentColor" stroke-width="4" stroke-opacity="0.12"/></pattern></defs><rect width="200" height="200" fill="url(#sp)"/></svg>
      <span class="proj-fig-label">${label}</span>
    </div>
  </div>`;
}

/* ---------- project window content ---------- */
const PROJECTS = {
  mirchi: {
    title: 'Mirchi',
    accent: '#E8B07A',
    dark: false,
    tagline: 'The Essence of True Indian Dining',
    discover: { label: 'Download Menu', href: 'uploads/Mirchi Final Design.pdf', download: true },
    meta: [
      ['Client', 'Mirchi Indian Cuisine'],
      ['Scope', 'Menu Design / Brand Refresh'],
      ['Tools', 'InDesign / Photoshop / Illustrator'],
      ['Timeline', '3 to 4 Weeks']
    ],
    sections: [
      { kind: 'two', label: '01 · Overview',
        head: 'A menu frozen in 2014, for a restaurant that deserved better.',
        body: `<p>Mirchi's menu has not been updated since 2014, when the restaurant first opened in Canberra. This freelance project involved working with a well-known Indian-cuisine restaurant in Canberra for the time frame of 3 to 4 weeks. Mirchi's previous menu lacked creativity and direction.</p>
        <p>After discussing the design with the client, it was understood that the final design must include the name and clear description of the dishes, appropriate imagery and a consistent background that did not overpower the dishes.</p>
        <p>The final design was created on Adobe InDesign, with imagery from Envato Elements. These images were made into elements and edited using Adobe Photoshop. Adobe Illustrator was used for the final graphics and vector touch up.</p>
        <p>This project taught me the value of a seamless multi-software workflow, demonstrating how the integration of Photoshop, Illustrator and InDesign is essential for maintaining a high-quality final design. I learnt how to balance creative vision with client expectations, translating abstract feedback into a functional visual design.</p>`,
        figs: [
          { label: 'Hero spread', img: 'imgs/mirchi-hero.png' },
          { label: 'Menu title', img: 'imgs/mirchi-title.png' }
        ]
      },
      { kind: 'two', label: '02 · Original Menu',
        head: 'What came before.',
        body: `<p>The previous red, green, black and white colour palette lacked a cohesive brand identity and appeared uninspired. The high-contrast colours competed for reader attention rather than guiding it. The simple brochure style layout was not durable for the restaurant environment as it did not create a welcoming mood but rather an ordinary take-out restaurant feel. The lack of imagery in the menu also forced customers to rely on text descriptions.</p>`,
        figs: [
          { label: 'Original menu', img: 'imgs/mirchi-hero.png' }
        ]
      },
      { kind: 'two', label: '03 · Redesigned Menu',
        head: 'Brown, white and red, drawn from Indian spices and cultural cutlery.',
        body: `<p>The new menu design incorporates a brown, white and red palette inspired by Indian spices and cultural cutlery, creating an immediate homey and authentic atmosphere. The menu features high-quality imagery of actual dishes, allowing customers to visualise the dish, proven to increase customer appetite and average spend. The layout was reimagined to a flat laminated design.</p>`,
        figs: [
          { label: 'Redesigned menu', img: 'imgs/mirchi-title.png' }
        ]
      }
    ]
  },

  sund: {
    title: 'Sun & D',
    accent: '#F0D9B8',
    dark: false,
    tagline: 'Smart Sun Habits for Healthy Vitamin D',
    discover: { label: 'View Prototype', href: 'https://www.figma.com/proto/HLO2wb4L5kIwFjax5Lya1P/Sun---D-QLD-n11539151?node-id=8021-4&starting-point-node-id=8021%3A4&t=yZhPzlhB2KBQ7fx4-1', download: false },
    meta: [
      ['Client', 'QLD Health Clinic (Confidential)'],
      ['Scope', 'UX Design / Prototyping'],
      ['Tools', 'Figma / Mockflow / Illustrator'],
      ['Timeline', '2 Months']
    ],
    sections: [
      { kind: 'two', label: '01 · The Brief',
        head: 'Smart Sun Habits for Healthy Vitamin D.',
        body: `<p>The South Asian community in Australia often struggles with incorrect representation of darker skin in educational materials about sun safety. For people of colour, melanoma incidences are much lower, but diagnosis can be late often due to uncertainty among the community. Much like sun safety, the studies about vitamin D, often do not accommodate for those of South Asian descent or darker skinned individuals in general.</p>
        <p>The project duration was approximately 2 months, where I individually designed the Figma prototype Sun and D. The design process involved primary research of the South Asian community, to find the key issues the audience currently faces. These issues were addressed in the final concept.</p>
        <p>Research showed a language barrier between medical professionals and South Asians; hence the Sun and D app is available in a range of languages including but not limited to English, Malayalam, Tamil and Hindi. The app provides a quick checklist for users, taking into consideration clothing preferences of the community.</p>`,
        figs: [
          { label: 'App overview', img: 'imgs/sund-hero.png' },
          { label: 'Screen detail', img: 'imgs/sund1.png' }
        ]
      },
      { kind: 'image', label: '02 · Key Screens',
        head: 'Multilingual, culturally aware, community first.',
        body: `<p>Primary research shaped every screen. The app provides a quick checklist taking into consideration clothing preferences of the community, a language selector at onboarding, and skin-tone aware sun exposure guidance that does not assume a default skin tone.</p>`,
        figs: [
          { label: 'Screen set 2', img: 'imgs/sund2.png' },
          { label: 'Screen set 3', img: 'imgs/sund3.png' },
          { label: 'Screen set 4', img: 'imgs/sund4.png' }
        ]
      }
    ]
  },

  nestify: {
    title: 'Nestify',
    accent: '#BED4C2',
    dark: false,
    tagline: 'Smart Home, Simpler Life',
    discover: { label: 'View Prototype', href: 'https://www.figma.com/proto/9tnAwLwXqkbNLaLz8MVfLE/Untitled?node-id=83-39&p=f&t=GzfXcryc542PjcQ8-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=83%3A39&show-proto-sidebar=1', download: false },
    meta: [
      ['Client', 'Joshua Carrington · Personal Use'],
      ['Scope', 'UX / UI Design / Prototyping'],
      ['Tools', 'Figma'],
      ['Timeline', '7 Weeks']
    ],
    sections: [
      { kind: 'two', label: '01 · Brief',
        head: 'Smart Home, Simpler Life.',
        body: `<p>This project was completed in the time frame of 7 weeks. Using the UI Design tool Figma, the client requested a smartphone app that is custom-built to automate everyday tasks such as operating window blinds, controlling fan/air-conditioning, lights and locking doors.</p>
        <p>This design process involved constant user testing to ensure the app features all the specific requirements. The design process involved a detailed interview with the client to understand the brief, secondary research to identify existing projects and improvements and user testing regarding design elements, navigation and accessibility.</p>
        <p>This process highlighted the importance of customer feedback when designing for specific client needs. Taking time to interview the customer provided vital information before I started creating the Figma prototype. This led to a smooth user testing process which focused on design elements, navigation and accessibility rather than features.</p>`,
        figs: [
          { label: 'Home dashboard', img: 'imgs/nestify-hero.png' },
          { label: 'Screens overview', img: 'imgs/nestify1.png' }
        ]
      },
      { kind: 'two', label: '02 · Features',
        head: 'What the client needed, and why existing apps were not enough.',
        body: `<p>Secondary research showed existing brands are not meeting the client's need for convenience and privacy. The client expressed the following app specifications in the brief interview:</p>
        <ul class="bullets">
          <li>Automated Window Blinds</li>
          <li>App controlled Fan</li>
          <li>App controlled Lights</li>
          <li>Automated Door Lock</li>
          <li>TV Remote Control</li>
          <li>Air Conditioning Temperature Control</li>
        </ul>
        <p>The client also expressed design considerations including a preference for convenience and ease of use, concerns about what makes existing apps unappealing, privacy concerns around data collection and storage, and awareness of overreliance on technology.</p>`,
        figs: [
          { label: 'Blinds control', img: 'imgs/nestify-blinds.png' },
          { label: 'Air-con control', img: 'imgs/nestify-ac.png' }
        ]
      },
      { kind: 'image', label: '03 · User Testing and Changes',
        head: 'Five users. Three features iterated.',
        body: `<p>User testing was conducted on 5 different participants, each outlining areas of improvement and positive findings. Users were asked to carry out simple tasks on the app. User concern led to iterations before the final high-fidelity prototype.</p>
        <p><strong>Feature 1 - Accessibility.</strong> The option to Zoom in and out was added after user testing to meet accessibility requirements. The client specified that though it was a mobile app, the client's older parents would need to use it and often have trouble with small text. This feature was added through a simple button, allowing the font size to increase or decrease upon user request.</p>
        <p><strong>Feature 2 - Navigation.</strong> As user testing showed uncertainty of page directions, an arrow icon was added to the bottom of the screen allowing users to switch between controls of different rooms from one place. The user can also go back and forth between rooms by swiping left and right for easy navigation.</p>
        <p><strong>Feature 3 - Scroll Motion.</strong> Similarly, a side scroll was visibly added to the right-hand side of the page, clearly labelling which page users can scroll further on. This scroll moves alongside the text as users scroll, creating visually appropriate page movement. This iteration meets user requirements.</p>`,
        figs: [
          { label: 'New device', img: 'imgs/nestify-signup.png' },
          { label: 'TV remote', img: 'imgs/nestify-tv.png' },
          { label: 'Overview 2', img: 'imgs/nestify2.png' },
          { label: 'Speaker screen', img: 'imgs/nestify-speaker.png' }
        ]
      }
    ]
  },

  travel: {
    title: 'Travel Blog',
    accent: '#6B4028',
    dark: true,
    tagline: 'Wanderlust by Amritha',
    discover: { label: 'Visit Website', href: 'https://anilamritha.github.io/TravelBlog/', download: false },
    meta: [
      ['Client', 'Personal Project'],
      ['Scope', 'Web Design / Frontend Development'],
      ['Tools', 'HTML / CSS / JavaScript'],
      ['Timeline', '6 Weeks']
    ],
    sections: [
      { kind: 'two', label: '01 · Brief',
        head: 'Wanderlust by Amritha.',
        body: `<p>The client frequently travels abroad and enjoys sharing images she captures overseas, online to her friends and family. The design project was approximately 6 weeks and required HTML and CSS coding on Visual Studio Code.</p>
        <p>The client's requirements included a visually appealing website to be used on mobile, desktop or tablet. The website must feature a welcome page with the client's information and social media pages, the client's travel photos, a page where users can read more about different travel locations and a contact page.</p>
        <p>Throughout the 6 weeks, wireframes and prototypes were iterated based on regular meetings with the client. The final design incorporates moving image carousels, embedded social media links, a custom loading page and location-based contact details.</p>`,
        figs: [
          { label: 'Hero', img: 'imgs/travel-hero.png' },
          { label: 'On iMac', img: 'imgs/travel-imac.png' }
        ]
      },
      { kind: 'two', label: '02 · Images',
        head: 'Gesture refinement and image quality at the centre of iteration.',
        body: `<p>The iteration process allowed for improvement of image quality and essential gestures/finger movements. This was vital in the final design as the website would not function efficiently. By refining these interactions, I ensured that the digital interface felt natural and responsive, fostering a seamless connection between the user and the content. This enhances my ability to design for usability when prototyping, creating high-fidelity designs that are visually compelling but also functional for the required audience.</p>`,
        figs: [
          { label: 'On iPhone', img: 'imgs/travel-phone.png' },
          { label: 'On iPad', img: 'imgs/travel-ipad.png' }
        ]
      },
      { kind: 'two', label: '03 · Originality',
        head: 'All content sourced from the client\'s personal travel archive.',
        body: `<p>All the images and videos were sourced from the client's personal travel content, ensuring originality. The website included a contact page for the wider audience to find more information on locations and travel tips. Utilising these authentic assets allowed me to create a unique visual identity that resonates with genuine storytelling rather than relying on generic stock images. This ensures the platform is community-driven and welcoming for aspiring travelers.</p>`,
        figs: [
          { label: 'On MacBook', img: 'imgs/travel-mac.png' }
        ]
      }
    ]
  },

  newlyf: {
    title: 'NewLyf',
    accent: '#EFE6DC',
    dark: false,
    tagline: 'Manly West Living',
    discover: { label: 'Visit Website', href: 'https://anilamritha.github.io/newlyf/', download: false },
    meta: [
      ['Client', 'Real Estate Company in Manly West'],
      ['Scope', 'Web Design / Frontend Development'],
      ['Tools', 'HTML / CSS / JavaScript'],
      ['Timeline', '7 Weeks']
    ],
    sections: [
      { kind: 'two', label: '01 · Brief',
        head: 'Manly West Living.',
        body: `<p>Newlyf is a responsive retirement and investment home website developed on Visual Studio Code using HTML and CSS. Designed and coded within a 7-week timeframe, the project serves as a comprehensive demonstration of accessible front-end development tailored specifically for older adults aged 65 and above.</p>
        <p>The primary challenge was to create a digital presence that balanced modern aesthetics with high accessibility standards required for the target demographic. Prioritising information architecture ensured that the navigation was intuitive and the content was immediately clear to users with varying levels of digital literacy.</p>
        <p>Imagery was strategically sourced from Google Earth and current local development sites, providing users with an authentic, tangible sense of their potential future environment.</p>`,
        figs: [
          { label: 'Hero', img: 'imgs/newlyf-hero.png' },
          { label: 'Laptop view', img: 'imgs/newlyf-laptop.png' }
        ]
      },
      { kind: 'image', label: '02 · Design Elements',
        head: 'Usability across every device, for every member of the household.',
        body: `<p>The final code maintains usability across mobile, tablet and desktops. User-centric design choices were also made including legible typography for the target audience and clear touch/movement of users to ensure the design was usable. These design elements address common accessibility challenges faced by older users, ensuring the functionality of the website offers a truly inclusive user experience.</p>`,
        figs: [
          { label: 'On iPad', img: 'imgs/newlyf-ipad.png' },
          { label: 'On phone', img: 'imgs/newlyf-phone.png' }
        ]
      }
    ]
  },

  winnlane: {
    title: 'Winn Lane',
    accent: '#340B01',
    dark: true,
    tagline: 'Play, Explore, Interact',
    discover: { label: 'Play the Games', href: 'https://anilamritha.github.io/WinnLane/', download: false },
    meta: [
      ['Client', 'Arthur Apostolis · Director of Winn Ln'],
      ['Scope', 'Interactive Design / Game Dev'],
      ['Tools', 'p5.js / Illustrator'],
      ['Timeline', '7 Weeks']
    ],
    sections: [
      { kind: 'two', label: '01 · The Commission',
        head: 'An interactive exhibition to draw in customers and create lasting memories within the lane.',
        body: `<p>Winn Lane Fortitude Valley requested an interactive creative coding exhibition to draw in customers, create lasting memories within the lane and persuade customers to interact with different people. This Creative Coding Project was completed in 7 weeks, using p5.js for the code and Adobe Illustrator for images.</p>
        <p>The final project is a creative solution, incorporating mini games that celebrate different aspects of Winn Lane, creating a welcoming, accessible and distinctive theme. The design process involved mapping user journeys and Winn Lane's story to capture the audience and drive engagement. The games were designed based on actual stores in Winn Lane, encouraging customers to visit the stores after playing the games.</p>
        <p>This design process required constant iteration after user testing and trial and error. Despite this, the final solution evidenced strong attention to detail and passion for community participation.</p>`,
        figs: [
          { label: 'Cabinet hero', img: 'imgs/winnlane-hero.png' },
          { label: 'Game screens', img: 'imgs/winnlane1.png' }
        ]
      },
      { kind: 'two', label: '02 · Background',
        head: 'A lane built on community, queerness and small business.',
        body: `<p>Arthur created Winn Lane to bring small businesses to life and give opportunity for first-time businesses. Winn Lane has a large Queer community and draws in many customers with over 80 premises of cafe services, retail stores and bars within the lane. This exhibition was created in hopes of reaching a wider audience, creating a sense of community within the lane. There was an opportunity to showcase small businesses and drive customer retention.</p>
        <p>The creative code was to be exhibited on the Louie Play Cabinet, a cabinet based on the look of a retro arcade machine and old-style computers. The cabinet had its own set of unique inputs suited for different styles of coding sketch. The Louie Play Cabinet's input included a 4-way joystick and three arcade buttons. This meant that the code had to be suited for this cabinet's use. The most challenging portion of this project was ensuring the games remained fun and entertaining with the 3 buttons and joystick.</p>`,
        figs: [
          { label: 'Game screens 2', img: 'imgs/winnlane2.png' }
        ]
      },
      { kind: 'image', label: '03 · The Three Games',
        head: 'Ben\'s Burgers. Quivr Bar. No. 5 Cafe.',
        body: `<p>After trial and error, an unsatisfactory drag-and-drop mechanism in Ben's Burger evolved to a falling burger stack game. Quivr Bar's cocktail making game was aesthetically edited multiple times before finalising the simple game. Finally, No. 5's Cafe's coffee drawing game gives users the freedom to select various shapes to draw.</p>
        <p>Each game is tied to a real shopfront, designed so players want to visit the actual store after playing. All visual assets were illustrated in Illustrator and exported as PNGs for use in p5.js.</p>`,
        figs: [
          { label: 'Game screens 3', img: 'imgs/winnlane3.png' }
        ]
      }
    ]
  }
};


(() => {
  const win = document.getElementById('projWindow');
  const scrim = document.getElementById('winScrim');
  const body = document.getElementById('winBody');
  const titleEl = document.getElementById('winTitle');

  function buildProject(p){
    const heroClass = p.dark ? 'proj-hero is-dark' : 'proj-hero';
    const meta = p.meta.map(m => `<div><span>${m[0]}</span>${m[1]}</div>`).join('');

    let sectionsHtml = '';
    p.sections.forEach(s => {
      const figs = (s.figs || []);
      const renderFig = f => fig(f.label, f.img || '', f.accent || 'var(--c-mint)');
      if (s.kind === 'two'){
        sectionsHtml += `
          <section class="proj-section">
            <div class="two-col">
              <div>
                <div class="label">${s.label}</div>
                <h3>${s.head}</h3>
                ${s.body}
              </div>
              <div>${figs.map(renderFig).join('')}</div>
            </div>
          </section>
        `;
      } else if (s.kind === 'image'){
        sectionsHtml += `
          <section class="proj-section">
            <div class="label">${s.label}</div>
            <h3>${s.head}</h3>
            ${s.body}
            <div class="proj-figure-grid">
              ${figs.map(renderFig).join('')}
            </div>
          </section>
        `;
      }
    });

    const discoverBtn = p.discover
      ? `<a class="btn discover-btn" href="${p.discover.href}" ${p.discover.download ? 'download' : 'target="_blank" rel="noopener"'} data-cursor="hover">${p.discover.label} &rarr;</a>`
      : '';

    return `
      <article class="proj">
        <header class="${heroClass}" style="--proj-accent:${p.accent}">
          <div class="proj-eyebrow">${p.title} · case study</div>
          <h2 class="proj-title">${p.title}</h2>
          <p class="proj-tagline">${p.tagline}</p>
          <div class="proj-meta-grid">${meta}</div>
        </header>
        ${sectionsHtml}
        <section class="proj-section" style="border-bottom:0;">
          <div class="label">discover</div>
          <h3>Ready to see it in the world?</h3>
          <p>Explore the finished project below, or get in touch if you have a similar brief.</p>
          <div class="cta-row">
            ${discoverBtn}
            <a class="btn primary" href="mailto:amritha2825@gmail.com" data-cursor="hover">Email me</a>
            <a class="btn" href="https://www.behance.net/amrithaanil1" target="_blank" rel="noopener" data-cursor="hover">More on Behance</a>
          </div>
        </section>
      </article>
    `;
  }

  function open(key){
    const p = PROJECTS[key];
    if (!p) return;
    titleEl.textContent = p.title.toLowerCase();
    body.innerHTML = buildProject(p);
    body.scrollTop = 0;
    scrim.classList.add('is-open');
    win.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    gsap.fromTo('#projWindow .proj-title',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', delay: .1 });
    gsap.fromTo('#projWindow .proj-tagline, #projWindow .proj-meta-grid',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.08, delay: .25 });

    gsap.utils.toArray('#projWindow .proj-section').forEach(sec => {
      gsap.fromTo(sec,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sec, scroller: '#winBody', start: 'top 90%' }
        });
    });
  }

  function close(){
    scrim.classList.remove('is-open');
    win.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.folder-tile').forEach(f => {
    f.addEventListener('click', () => open(f.dataset.project));
  });
  scrim.addEventListener('click', close);
  document.getElementById('winClose').addEventListener('click', close);
  document.getElementById('winCloseText').addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && win.classList.contains('is-open')) close();
  });
})();


/* ---------- smooth anchor scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const t = document.querySelector(id);
    if (t){
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - 30, behavior: 'smooth' });
    }
  });
});
