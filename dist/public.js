(function () {
  const arrow = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const leaf = '<svg width="31" height="31" viewBox="0 0 40 40" fill="none"><path d="M20 32V18M20 23C7 23 7 10 7 10s13-1 13 13Z" fill="currentColor"/><path d="M20 18C20 5 33 5 33 5s1 13-13 13Z" fill="currentColor"/><path d="M6 29c6 7 22 7 28-1" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
  const fallbackProjects = [
    { id: 'education', tag: 'EDUCATION', name: 'A brighter start for every child', desc: 'Learning resources, welcoming classrooms, and the encouragement to dream a little bigger.', image: './assets/photo-1497486751825-1233686d5d80.jpg', alt: 'Children reading and learning together in a classroom', detail: 'This sample education program brings together learning materials, after-school support, and local volunteers. A project team can track its budget, attendance, beneficiaries, photographs, and progress from the foundation dashboard.' },
    { id: 'health', tag: 'HEALTH & WELLBEING', name: 'Care that reaches the community', desc: 'Helping families connect with health awareness, preventive care, and local support.', image: './assets/photo-1576091160399-112ba8d25d1d.jpg', alt: 'Healthcare professional offering support', detail: 'This illustrative community care initiative focuses on health awareness and access to local support. Use the project workspace to plan outreach camps, coordinate volunteers, and record expenses. Clinical services should be organized with qualified professionals.' },
    { id: 'environment', tag: 'ENVIRONMENT', name: 'Growing a greener tomorrow', desc: 'Bringing neighbours together to care for the places we all call home.', image: './assets/photo-1542601906990-b4d3fb778b09.jpg', alt: 'Hands holding a young green plant', detail: 'This sample environmental program gives neighbourhoods a way to organize planting activities, clean-up days, and ongoing care. Teams can manage event participants, supplies, and project milestones in the dashboard.' }
  ];
  const fallbackStories = [
    {title: 'Every classroom begins with a little possibility', category: 'FROM THE FIELD', image: './assets/photo-1503676260728-1c00da094a0b.jpg', text: 'A welcoming learning space is built one thoughtful step at a time: a book within reach, a patient mentor, and a chance to ask questions. This sample story shows how the foundation can share updates from its education initiatives. Replace it with an approved field report through Website CMS.'},
    {title: 'The many ways to give your time', category: 'VOLUNTEER VOICES', image: './assets/photo-1559027615-cd4628902d4a.jpg', text: 'Some people teach. Others help organize an event, design a poster, or keep careful records. A volunteer community makes room for different skills and different schedules. This illustrative article can be replaced with a story from your own volunteers.'}
  ];
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validUrl = value => { try { const u=new URL(value); return u.protocol==='https:' ? u.href : ''; } catch { return ''; } };
  const safeImage = value => { const v=String(value || ''); return /^(?:\.\/)?assets\/[a-zA-Z0-9._/-]+$/.test(v) && !v.includes('..') ? v : validUrl(v) || fallbackProjects[0].image; };
  let currentProjects = fallbackProjects, currentStories = fallbackStories;
  const fallbackEvents = [
    {id:'sample-learning',name:'A day for learning, a day for possibility',date:'2026-11-08',location:'Community event',description:'Book collection, creative activities, and a chance to connect.'},
    {id:'sample-green',name:'Let’s give our neighbourhood a little love',date:'2026-11-22',location:'Outdoor activity',description:'A community clean-up and planting day with local volunteers.'}
  ];
  window.renderPublicSite = function () {
    const settings = window.foundationSettings || {};
    const data = window.foundationData || {};
    currentProjects = Array.isArray(data.projects) ? data.projects.map((p,i)=>({id:String(p.id),tag:String(p.category || 'COMMUNITY'),name:p.name || 'Community initiative',desc:p.description || 'A community initiative from Seva Setu Foundation.',detail:p.description || 'Contact the foundation to learn more about this initiative.',image:safeImage(p.image || fallbackProjects[i % fallbackProjects.length].image),alt:p.name || 'Community initiative'})) : fallbackProjects;
    currentStories = Array.isArray(data.news) ? data.news.filter(s=>String(s.status).toLowerCase()==='published').map((s,i)=>({id:String(s.id),title:s.title || 'Community update',category:'FOUNDATION NEWS',image:safeImage(s.image || fallbackStories[i % fallbackStories.length].image),text:s.body || '',date:s.date || ''})) : fallbackStories;
    const projects = currentProjects, stories = currentStories;
    const events = Array.isArray(data.events) ? data.events.filter(e=>String(e.status).toLowerCase()!=='cancelled') : fallbackEvents;
    const navDefaults = [{id:'about',label:'Who we are'},{id:'projects',label:'Our work'},{id:'events',label:'Events'},{id:'stories',label:'Stories'},{id:'contact',label:'Contact'}];
    const navItems = Array.isArray(settings.publicMenu) ? settings.publicMenu.map(item=>typeof item==='string'?navDefaults.find(n=>n.id===item):item).filter(item=>item&&navDefaults.some(n=>n.id===item.id)&&item.visible!==false) : navDefaults;
    const navHtml = navItems.map(item=>`<a href="#pub-${safe(item.id)}">${safe(item.label || navDefaults.find(n=>n.id===item.id).label)}</a>`).join('');
    const eventsHtml = events.map(e=>{
      const date=new Date(String(e.date || '')+'T12:00:00');
      const day=Number.isNaN(date.getTime())?'—':date.getDate().toString().padStart(2,'0');
      const month=Number.isNaN(date.getTime())?'TBC':date.toLocaleString('en',{month:'short'}).toUpperCase();
      const full=Number(e.capacity)>0&&Number(e.registered)>=Number(e.capacity);
      return `<article class="pub-event-row"><div class="pub-event-date"><strong>${day}</strong><span>${month}</span></div><div class="pub-event-info"><span>${safe(e.time || 'COMMUNITY EVENT')}${e.location?' · '+safe(e.location):''}</span><h3>${safe(e.name)}</h3><p>${safe(e.description || 'Come together with your community and make a difference.')}</p></div><span class="pub-event-mode">${safe(e.location || 'Community event')}</span><button class="pub-button pub-button-outline" data-public-action="event" data-public-id="${safe(e.id)}" ${full?'disabled':''}>${full?'Fully registered':'Register interest'} ${arrow}</button></article>`;
    }).join('') || '<p class="pub-empty">New community events will be announced here.</p>';

    const foundationName = safe(settings.name || 'Seva Setu Foundation');
    const mission = safe(settings.mission || 'Connect people with purposeful opportunities to support education, wellbeing, and stronger communities.');
    const vision = safe(settings.vision || 'Communities where dignity, opportunity, and mutual support are within everyone’s reach.');
    const rawPhone = String(settings.phone || '').replace(/\D/g,'');
    const phoneDigits = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
    const rawWhatsApp = String(settings.whatsapp || '').replace(/\D/g,'');
    const whatsDigits = rawWhatsApp.length === 10 ? '91' + rawWhatsApp : rawWhatsApp;
    const contactLinks = [
      /^(?:\d{7,15})$/.test(phoneDigits) ? `<a class="pub-contact-link" href="tel:+${phoneDigits}">Call the foundation ${arrow}</a>` : '',
      /^(?:\d{7,15})$/.test(whatsDigits) ? `<a class="pub-contact-link" href="https://wa.me/${whatsDigits}" target="_blank" rel="noopener noreferrer">WhatsApp us ${arrow}</a>` : '',
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email || '') ? `<a class="pub-contact-link" href="mailto:${safe(settings.email)}">${safe(settings.email)} ${arrow}</a>` : '',
      validUrl(settings.mapUrl) ? `<a class="pub-contact-link" href="${safe(validUrl(settings.mapUrl))}" target="_blank" rel="noopener noreferrer">Find us on the map ${arrow}</a>` : ''
    ].filter(Boolean).join('');
    const socialLinks = [['youtube','YouTube'],['facebook','Facebook'],['instagram','Instagram']].map(([key,label]) => validUrl(settings[key]) ? `<a href="${safe(validUrl(settings[key]))}" target="_blank" rel="noopener noreferrer">${label} ${arrow}</a>` : '').join('');
    return `<div class="public-site">
      <div class="pub-announcement">A bridge between compassion and action. <a href="#pub-involved">Find your way to give back ${arrow}</a></div>
      <header class="pub-header"><a class="pub-brand" href="#pub-home" aria-label="Seva Setu Foundation home"><span class="pub-brand-mark">${leaf}</span><span><strong>seva setu<span class="pub-brand-dot">.</span></strong><small>F O U N D A T I O N</small></span></a><nav aria-label="Public website">${navHtml}</nav><div class="pub-header-actions"><button class="pub-text-button" data-public-action="memberPortal">Member portal ${arrow}</button><button class="pub-button pub-button-green" data-public-action="donation">Donate ${arrow}</button><button class="pub-menu" data-public-action="menu" aria-label="Open navigation" aria-expanded="false"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div></header>
      <main>
        <section class="pub-hero pub-section" id="pub-home"><div class="pub-hero-copy"><div class="pub-eyebrow"><span></span> TOGETHER, WE MAKE A DIFFERENCE</div><h1>Small acts.<br>Stronger<br><em>communities.</em></h1><p>When compassion meets collective action, change takes root. Join Seva Setu Foundation in building a more caring, connected tomorrow.</p><div class="pub-hero-buttons"><button class="pub-button pub-button-green" data-public-action="volunteer">Be part of the change ${arrow}</button><a class="pub-text-button" href="#pub-projects">Explore our work ${arrow}</a></div><div class="pub-hero-foot"><span class="pub-small-sun">✳</span><span>Every hand helps.<br><strong>Every act of kindness matters.</strong></span></div></div><div class="pub-hero-visual"><div class="pub-photo-backdrop"></div><img class="pub-hero-photo" src="./assets/photo-1488521787991-ed7bbaae773c.jpg" alt="Children smiling together outdoors" fetchpriority="high"><div class="pub-hero-note"><span class="pub-note-icon">♡</span><div>Built on compassion.<br><strong>Powered by people.</strong></div></div><span class="pub-photo-caption">A shared future starts with us.</span><span class="pub-hero-doodle">✳</span></div></section>
        <section class="pub-values-strip" aria-label="Our focus areas"><span>Education for all</span><i>✳</i><span>Health & dignity</span><i>✳</i><span>Community empowerment</span><i>✳</i><span>A greener future</span></section>
        <section class="pub-about pub-section" id="pub-about"><div><div class="pub-eyebrow">THE BRIDGE WE BUILD</div><h2>Good intentions.<br><em>Meaningful action.</em></h2></div><div class="pub-about-copy"><p class="pub-lead">Seva means service. Setu means bridge. Our purpose is to bring people and possibilities together.</p><p>Seva Setu Foundation is a place for people who want to contribute their time, skills, and resources to community-led change. We believe everyone has something to give, and everyone deserves the opportunity to thrive.</p><div class="pub-mission-grid"><div><span>01 / OUR MISSION</span><h3>Turn care into action.</h3><p>${mission}</p></div><div><span>02 / OUR VISION</span><h3>A future we share.</h3><p>${vision}</p></div></div></div></section>
        <section class="pub-work" id="pub-projects"><div class="pub-section"><div class="pub-section-head"><div><div class="pub-eyebrow">WHERE COMPASSION TAKES SHAPE</div><h2>Our work. <em>Our shared purpose.</em></h2></div><span class="pub-preview-label">Illustrative programs</span></div><div class="pub-project-grid${projects.length===4?' pub-grid-four':''}">${projects.map(p=>`<article class="pub-project-card"><button class="pub-project-image" data-public-action="project" data-public-id="${safe(p.id)}" aria-label="Explore ${safe(p.name)}"><img src="${safe(safeImage(p.image))}" alt="${safe(p.alt)}" loading="lazy"><span class="pub-round-arrow">${arrow}</span></button><span class="pub-card-tag">${safe(p.tag)}</span><h3>${safe(p.name)}</h3><p>${safe(p.desc)}</p><button class="pub-text-button" data-public-action="project" data-public-id="${safe(p.id)}">Explore initiative ${arrow}</button></article>`).join('') || '<p class="pub-empty">Our next community initiatives will be shared here.</p>'}</div></div></section>
        <section class="pub-involved pub-section" id="pub-involved"><div class="pub-involved-image"><img src="./assets/photo-1559027615-cd4628902d4a.jpg" alt="Volunteers working together on a community activity" loading="lazy"><div class="pub-involved-sticker">A little of your time.<br><em>A world of possibility.</em></div></div><div class="pub-involved-copy"><div class="pub-eyebrow">THERE’S A PLACE FOR YOU HERE</div><h2>Give what you can.<br><em>Change what you can.</em></h2><p>You don’t need a special title to make a difference. Just a little time, an open heart, and the willingness to begin.</p><button class="pub-involvement-option" data-public-action="volunteer"><span class="pub-option-num">01</span><span><strong>Volunteer your time</strong><small>Bring your skills. Find your community.</small></span>${arrow}</button><button class="pub-involvement-option" data-public-action="member"><span class="pub-option-num">02</span><span><strong>Become a member</strong><small>Stay connected to the work you believe in.</small></span>${arrow}</button><button class="pub-involvement-option" data-public-action="donation"><span class="pub-option-num">03</span><span><strong>Support a cause</strong><small>Make a donation pledge for a brighter future.</small></span>${arrow}</button></div></section>
        <section class="pub-events" id="pub-events"><div class="pub-section"><div class="pub-section-head"><div><div class="pub-eyebrow">COME TOGETHER. DO SOMETHING GOOD.</div><h2>Good things <em>on the horizon.</em></h2></div><span class="pub-preview-label">Community events</span></div><div class="pub-event-list">${eventsHtml}</div><p class="pub-event-disclaimer">Event details and registration are managed by the foundation. Please contact us if you need help participating.</p></div></section>
        <section class="pub-stories pub-section" id="pub-stories"><div class="pub-section-head"><div><div class="pub-eyebrow">LITTLE MOMENTS. LASTING CONNECTIONS.</div><h2>Stories from <em>our community.</em></h2></div><button class="pub-text-button" data-public-action="gallery">Explore the gallery ${arrow}</button></div><div class="pub-stories-grid">${stories.map((s,i)=>`<article class="pub-story"><button class="pub-story-photo" data-public-action="story" data-public-id="${i}"><img src="${safe(safeImage(s.image))}" alt="${i===0?'A bright classroom ready for learning':'A community of volunteers taking action'}" loading="lazy"></button><div class="pub-story-body"><span class="pub-card-tag">${safe(s.category)} <span>${Array.isArray(data.news)?'':'· SAMPLE STORY'}</span></span><h3>${safe(s.title)}</h3><button class="pub-text-button" data-public-action="story" data-public-id="${i}">Read the story ${arrow}</button></div></article>`).join('') || '<p class="pub-empty">Stories from our community will appear here as they are published.</p>'}</div></section>
        <section class="pub-cta"><div class="pub-cta-flower">✳</div><div><div class="pub-eyebrow">THE NEXT STEP STARTS WITH YOU</div><h2>A kinder tomorrow<br>is something we build <em>together.</em></h2><p>Your time, your kindness, your support. It all makes a difference.</p><div><button class="pub-button pub-button-cream" data-public-action="donation">Support our work ${arrow}</button><button class="pub-button pub-button-light-outline" data-public-action="volunteer">Join as a volunteer ${arrow}</button></div></div><div class="pub-cta-circle"></div></section>
        <section class="pub-contact pub-section" id="pub-contact"><div><div class="pub-eyebrow">LET’S START A CONVERSATION</div><h2>Good things begin<br><em>with a hello.</em></h2></div><div><p>Have an idea, a question, or a way you’d like to help? We’d love to hear from you.</p><button class="pub-button pub-button-green" data-public-action="enquiry">Get in touch ${arrow}</button>${settings.address ? `<p class="pub-contact-address">${safe(settings.address)}</p>` : ''}${contactLinks ? `<div class="pub-contact-links">${contactLinks}</div>` : '<p class="pub-contact-note">Foundation contact details can be added in Website CMS.</p>'}</div></section>
      </main>
      <footer class="pub-footer"><div class="pub-footer-top"><div><a class="pub-brand" href="#pub-home"><span class="pub-brand-mark">${leaf}</span><span><strong>seva setu<span class="pub-brand-dot">.</span></strong><small>F O U N D A T I O N</small></span></a><p>A bridge between compassion and action.</p></div><div class="pub-footer-links"><div><strong>Discover</strong><a href="#pub-about">About the foundation</a><a href="#pub-projects">Our programs</a><a href="#pub-stories">Community stories</a></div><div><strong>Get involved</strong><button data-public-action="member">Become a member</button><button data-public-action="volunteer">Volunteer with us</button><button data-public-action="donation">Make a pledge</button></div><div><strong>Stay connected</strong><a href="#pub-events">Upcoming events</a><button data-public-action="enquiry">Contact us</button><button data-public-action="memberPortal">Member portal ${arrow}</button><button data-public-action="dashboard">Foundation dashboard ${arrow}</button>${socialLinks}</div></div></div><div class="pub-footer-bottom"><span>© ${new Date().getFullYear()} ${foundationName}. Made for a better tomorrow.</span><span class="pub-site-preview">Website preview · Programs and stories are illustrative</span></div></footer>
      <dialog class="pub-dialog" id="pub-detail-dialog"><button class="pub-dialog-close" data-public-action="close-dialog" aria-label="Close details">×</button><div id="pub-detail-content"></div></dialog>
    </div>`;
  };
  window.bindPublicSite = function () {
    const root = document.querySelector('#public-root') || document.querySelector('.public-site');
    if (!root || root.dataset.publicBound) return;
    root.dataset.publicBound = 'true';
    root.addEventListener('click', function (event) {
      const button = event.target.closest('[data-public-action]');
      if (!button) {
        if(event.target.closest('nav a')) { root.querySelector('nav')?.classList.remove('pub-nav-open'); root.querySelector('.pub-menu')?.setAttribute('aria-expanded','false'); }
        return;
      }
      const action = button.dataset.publicAction;
      const id = button.dataset.publicId;
      const dialog = document.getElementById('pub-detail-dialog');
      const content = document.getElementById('pub-detail-content');
      if (action === 'dashboard') window.navigate('dashboard');
      else if (action === 'memberPortal') window.navigate('memberPortal');
      else if (action === 'donation') { dialog?.close(); window.openDonation ? window.openDonation() : window.openForm('donation'); }
      else if (['volunteer','member','enquiry'].includes(action)) { dialog?.close(); window.openForm(action); }
      else if (action === 'event') { dialog?.close(); window.openForm('eventRegistration', { event: id }); }
      else if (action === 'menu') { const nav=root.querySelector('nav'); nav.classList.toggle('pub-nav-open'); button.setAttribute('aria-expanded',nav.classList.contains('pub-nav-open')); }
      else if (action === 'close-dialog') dialog.close();
      else if (action === 'project') {
        const p=currentProjects.find(p=>p.id===id); if(!p)return;
        content.innerHTML=`<img class="pub-dialog-image" src="${safe(safeImage(p.image))}" alt="${safe(p.alt)}"><span class="pub-card-tag">${safe(p.tag)} · SAMPLE INITIATIVE</span><h2>${safe(p.name)}</h2><p>${safe(p.detail)}</p><button class="pub-button pub-button-green" data-public-action="support-project" data-public-id="${safe(p.name)}">Support this initiative ${arrow}</button>`;
        dialog.showModal();
      } else if (action === 'support-project') { dialog.close(); window.openDonation ? window.openDonation({project:id}) : window.openForm('donation',{project:id}); }
      else if (action === 'story') {
        const s=currentStories[Number(id)]; if(!s)return;
        content.innerHTML=`<img class="pub-dialog-image" src="${safe(safeImage(s.image))}" alt="Community story"><span class="pub-card-tag">${safe(s.category)} · SAMPLE STORY</span><h2>${safe(s.title)}</h2><p>${safe(s.text)}</p><button class="pub-button pub-button-green" data-public-action="volunteer">Find your way to help ${arrow}</button>`;
        dialog.showModal();
      } else if(action==='gallery') {
        content.innerHTML=`<span class="pub-card-tag">MOMENTS OF CONNECTION · ILLUSTRATIVE GALLERY</span><h2>Small moments. Shared purpose.</h2><div class="pub-gallery-grid">${[...currentProjects,...currentStories.map(s=>({image:s.image,alt:s.title}))].map(p=>`<img src="${safe(safeImage(p.image))}" alt="${safe(p.alt)}" loading="lazy">`).join('')}</div>`;
        dialog.showModal();
      }
    });
    const dialog = document.getElementById('pub-detail-dialog');
    dialog?.addEventListener('click',e=>{ if(e.target===dialog)dialog.close(); });
  };
})();
