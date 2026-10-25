/* Seva Setu document tools. printFoundationDocument(type, data, branding) opens a
   printable document; the user can select Save as PDF in the print dialog.
   All documents default to sample mode. Only explicitly verified data should
   ever be supplied with demo:false. Tax requests never become tax certificates. */
(function () {
  'use strict';

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const logo = '<svg width="43" height="43" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="48" height="48" rx="13" fill="#175c4d"/><path d="M13 28c4 1 7 6 11 6s7-5 11-6M14 23l-3 3 5 10M34 23l3 3-5 10" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 28s-9-5-9-10a5 5 0 019-2 5 5 0 019 2c0 5-9 10-9 10z" fill="#d5b274"/></svg>';
  const money = value => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  const date = value => {
    if (!value) return new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'});
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'});
  };
  const field = (label, value) => '<div class="field"><span>'+esc(label)+'</span><strong>'+esc(value || '—')+'</strong></div>';

  function statusFor(data) {
    if (String(data.status || '').toLowerCase() === 'blocked') return 'Blocked';
    const validity = String(data.validity || '');
    const expiry = new Date(/^\d{4}-\d{2}-\d{2}$/.test(validity) ? validity + 'T23:59:59.999+05:30' : validity);
    if (validity && !Number.isNaN(expiry.getTime()) && expiry.getTime() < Date.now()) return 'Expired';
    return data.status || 'Sample record';
  }

  function verification(data, branding) {
    const fallback = location.origin + location.pathname + '#verify/' + encodeURIComponent(data.id || 'sample');
    let target = fallback;
    if (branding.verificationUrl) {
      try { const parsed = new URL(branding.verificationUrl, location.href); if (['http:','https:'].includes(parsed.protocol)) target = parsed.href; } catch (_) { /* Use the local verification page for invalid URLs. */ }
    }
    let image = '', dataURL = '';
    if (typeof window.QRCode === 'function') {
      try {
        const holder = document.createElement('div');
        new window.QRCode(holder, {text:target,width:100,height:100,colorDark:'#175c4d',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.M : 0});
        const canvas = holder.querySelector('canvas');
        const img = holder.querySelector('img');
        dataURL = canvas ? canvas.toDataURL('image/png') : img ? img.src : '';
        if (dataURL && dataURL.startsWith('data:image/')) image = '<img width="84" height="84" alt="QR code for verification preview" src="'+esc(dataURL)+'">';
      } catch (_) { /* The verification link remains available if a browser blocks canvas. */ }
    }
    return {image,target,dataURL,html:'<aside class="verification">'+(image || '<span class="qr-fallback">QR unavailable</span>')+'<div><strong>Record verification preview</strong><p>Scan to open this record’s verification page. Demonstration status uses records stored in the same browser and is not an independently verified identity.</p><a href="'+esc(target)+'">'+esc(data.id || 'Sample record')+' · Open verification</a></div></aside>'};
  }

  function receipt(data, sample) {
    return '<div class="eyebrow">DONOR ACKNOWLEDGEMENT</div><h1>Donation receipt</h1><p class="sub">Thank you for helping build a bridge to a better tomorrow.</p>'+
      '<div class="meta-grid">'+field('Receipt number',data.id || 'DRAFT')+field('Date',date(data.date))+field('Donor name',data.name || 'Donor')+field('Email',data.email)+field('Project / purpose',data.project || 'General fund')+field('Payment method',data.method || 'Not recorded')+'</div>'+
      '<div class="amount-box"><span>Donation amount</span><strong>'+esc(money(data.amount))+'</strong><small>Indian rupees · INR</small></div>'+
      '<p class="note">'+(sample ? '<strong>SAMPLE / NOT VALID FOR TAX CLAIMS.</strong> This receipt uses demonstration information and does not confirm a payment.' : 'This acknowledgement records the supplied donation details. It does not establish eligibility for any tax exemption.')+'</p>'+
      '<div class="signature"><span>For the foundation</span><div class="signature-line"></div><small>Authorised signatory · signature required</small></div>';
  }

  function certificate(type, data) {
    const definitions = {
      membership: ['Membership certificate','a valued member of','in recognition of their commitment to community service and positive social change.'],
      volunteer: ['Volunteer certificate','a volunteer with','in appreciation of their time, dedication, and contribution to community initiatives.'],
      appreciation: ['Certificate of appreciation','a supporter of','with sincere appreciation for their contribution and commitment to the community.'],
      participation: ['Certificate of participation','a participant in','for their active involvement and contribution.']
    };
    const copy = definitions[type] || definitions.appreciation;
    return '<div class="certificate"><div class="eyebrow">RECOGNISING THE SPIRIT OF SEVA</div><h1>'+esc(copy[0])+'</h1><div class="ornament">✦</div><p>This is to certify that</p><h2 class="recipient">'+esc(data.name || 'Recipient name')+'</h2><p>is '+esc(copy[1])+'<br><strong>'+esc(type === 'participation' ? (data.event || data.project || 'Community initiative') : 'Seva Setu Foundation')+'</strong>,</p><p class="citation">'+esc(data.description || copy[2])+'</p><div class="certificate-meta">'+field('Reference',data.id || 'DRAFT')+field('Issued on',date(data.date))+(data.validity ? field('Valid until',date(data.validity)) : '')+(data.hours ? field('Hours contributed',data.hours) : '')+(data.status ? field('Record status',statusFor(data)) : '')+'</div><div class="certificate-signatures"><div><div class="signature-line"></div><small>Authorised signatory · signature required</small></div><div class="seal">SEVA SETU<br><b>✦</b><br>FOUNDATION</div></div></div>';
  }

  function appointment(data) {
    return '<div class="eyebrow">DRAFT · REQUIRES AUTHORISED REVIEW</div><h1>Appointment letter</h1><p class="sub">A draft for internal review. This is not an executed employment agreement.</p><div class="meta-grid">'+field('Reference',data.id || 'DRAFT')+field('Date',date(data.date))+field('Employee',data.name || 'Employee name')+field('Position',data.role || data.position || 'To be confirmed')+field('Department',data.department || 'To be confirmed')+(data.validity ? field('Appointment valid until',date(data.validity)) : '')+field('Proposed joining date',data.joining ? date(data.joining) : 'To be confirmed')+'</div><p>Dear '+esc(data.name || 'Employee')+',</p><p>We are pleased to propose your appointment as <strong>'+esc(data.role || data.position || 'the position to be confirmed')+'</strong> with Seva Setu Foundation, subject to approval and completion of the foundation’s appointment process.</p>'+(data.duties || data.responsibilities ? '<h2 style="font-size:15px;margin-top:25px">Role and responsibilities</h2><p>'+esc(Array.isArray(data.duties || data.responsibilities) ? (data.duties || data.responsibilities).join('; ') : (data.duties || data.responsibilities))+'</p>' : '')+'<p>'+esc(data.description || 'Your responsibilities, compensation, reporting arrangements, working hours, probation period, and other terms must be reviewed and agreed in a final appointment letter before employment begins.')+'</p><p>We look forward to working together in service of our communities.</p><div class="note">DRAFT ONLY. No digital signature has been applied. The final appointment and all terms require approval and signatures from the foundation and the employee.</div><div class="certificate-signatures"><div><div class="signature-line"></div><small>For the foundation</small></div><div><div class="signature-line"></div><small>Employee acceptance</small></div></div>';
  }

  function idCard(data, brand, sample, qr) {
    return '<div class="eyebrow">'+(sample ? 'SAMPLE · ' : '')+'IDENTITY CARD</div><h1>Connected by a purpose.</h1><p class="sub">Printable member, volunteer, or employee identification.</p><div class="id-card"><div class="id-top">'+logo+'<div><strong>'+esc(brand.name)+'</strong><span>'+esc(data.type || data.role || 'Member')+'</span></div></div><div class="id-body"><div class="id-avatar">'+esc((data.name || '?').split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase())+'</div><div><h2>'+esc(data.name || 'Cardholder name')+'</h2><p>'+esc(data.department || data.role || 'Community member')+'</p><div class="id-number">'+esc(data.id || 'DRAFT')+'</div></div><div class="id-qr">'+qr.image+'</div></div><div class="id-bottom"><span>Valid until <strong>'+esc(data.validity ? date(data.validity) : 'To be confirmed')+'</strong></span><b>'+(sample ? 'SAMPLE · ' : '')+esc(statusFor(data))+'</b></div></div><p class="note">'+(sample ? 'SAMPLE CARD. This demonstration document does not establish identity or membership.' : 'For foundation identification only. This is not a government-issued identity document.')+'</p>';
  }

  function taxRequest(data) {
    return '<div class="eyebrow">REQUEST SUMMARY · CERTIFICATE PENDING</div><h1>Tax certificate request</h1><p class="sub">For internal review by the foundation’s authorised accounts team.</p><div class="meta-grid">'+field('Request / receipt reference',data.id || 'DRAFT')+field('Requested on',date(data.date))+field('Donor name',data.name || 'Donor')+field('Email',data.email)+field('Donation amount',money(data.amount))+field('Project / purpose',data.project || 'General fund')+'</div><div class="tax-pending"><strong>Approval and certificate number pending</strong><p>This document is a request summary, not an 80G or tax exemption certificate. The foundation’s registration details and the donor’s eligibility must be verified before an authorised certificate can be issued.</p></div><p class="note"><strong>NOT VALID FOR TAX CLAIMS.</strong> No tax exemption or deduction is represented or guaranteed by this request.</p>';
  }

  function report(data) {
    const rows = Array.isArray(data.rows) ? data.rows : [];
    const suppliedHeaders = Array.isArray(data.columns) && data.columns.length ? data.columns : Array.isArray(data.headers) && data.headers.length ? data.headers : null;
    const headers = suppliedHeaders || (rows.length && !Array.isArray(rows[0]) ? Object.keys(rows[0]) : rows.length && Array.isArray(rows[0]) ? rows[0].map((_,index) => 'Column '+(index+1)) : ['Description','Amount']);
    return '<div class="eyebrow">FOUNDATION REPORT</div><h1>'+esc(data.title || 'Activity report')+'</h1><p class="sub">'+esc(data.subtitle || 'A summary of the records currently available in this workspace.')+'</p><div class="meta-grid">'+field('Generated on',date(data.date))+field('Total records',rows.length)+field('Period',data.period || 'All available records')+(data.total != null ? field('Total amount',money(data.total)) : '')+'</div><table><thead><tr>'+headers.map(label => '<th>'+esc(label)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length ? rows.map(row => '<tr>'+headers.map((key,index) => '<td>'+esc(Array.isArray(row) ? row[index] : row[key])+'</td>').join('')+'</tr>').join('') : '<tr><td colspan="'+headers.length+'">No records available.</td></tr>')+'</tbody></table>'+(data.notes ? '<p class="note">'+esc(data.notes)+'</p>' : '');
  }

  const css = `
    .verification{display:flex;align-items:center;gap:17px;margin-top:30px;padding:18px;border:1px solid #e4ebe5;border-radius:7px;break-inside:avoid}.verification>img{flex:0 0 84px}.verification strong{font-size:11px;color:#315c46}.verification p{font-size:9px;color:#819087;margin:4px 0;line-height:1.5}.verification a{font-size:9px;color:#175c4d;overflow-wrap:anywhere}.qr-fallback{font-size:9px;width:84px;color:#819087}.id-qr{margin-left:auto;flex:0 0 70px}.id-qr img{width:70px;height:70px}.id-body{gap:15px!important}.id-avatar{flex-basis:65px!important;height:80px!important}.id-body h2{font-size:19px!important}
    *{box-sizing:border-box}body{margin:0;background:#edf1ee;color:#253e35;font:14px/1.65 Inter,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{position:sticky;top:0;background:#175c4d;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:16px 30px;z-index:2}.toolbar div{font-size:12px;opacity:.8}.toolbar button{border:0;background:#fff;color:#175c4d;border-radius:7px;padding:11px 20px;font:600 13px Arial;cursor:pointer}.page{position:relative;background:#fff;max-width:794px;min-height:1080px;margin:35px auto;padding:50px 56px;box-shadow:0 8px 35px #153d2712;border-top:8px solid #175c4d}.brand{display:flex;gap:13px;align-items:center;padding-bottom:28px;margin-bottom:32px;border-bottom:1px solid #e4ebe5}.brand strong{display:block;font-size:19px;letter-spacing:-.4px}.brand span{font-size:11px;color:#75857c;letter-spacing:.45px}.sample-chip{margin-left:auto;align-self:flex-start;font-size:9px;letter-spacing:1.2px;background:#f9f2e4;color:#8c6a2c;padding:5px 9px;border-radius:4px}.eyebrow{font-size:10px;font-weight:700;letter-spacing:2px;color:#9a7d42}h1{font:500 34px/1.2 Georgia,serif;margin:10px 0 15px;color:#175c4d}h2{line-height:1.25}.sub{color:#738179;margin-bottom:32px;font-size:12px}.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:32px 0}.field span{display:block;color:#839088;font-size:10px;text-transform:uppercase;letter-spacing:.9px;margin-bottom:3px}.field strong{font-size:13px;font-weight:600;overflow-wrap:anywhere}.amount-box{background:#eff6f0;border-radius:8px;padding:25px 28px;margin:32px 0;display:flex;flex-direction:column}.amount-box span{font-size:12px;color:#577063}.amount-box strong{font-size:38px;line-height:1.4;color:#175c4d}.amount-box small{font-size:10px;color:#7e8b82}.note{background:#faf8f2;border-left:3px solid #d5b274;padding:15px 18px;color:#776a51;font-size:11px;margin-top:28px}.signature{margin-top:60px;width:260px}.signature>span{font-size:12px}.signature-line{border-bottom:1px solid #bdc9c0;width:210px;height:35px}.signature small,.certificate-signatures small{color:#869288;font-size:10px}.footer{border-top:1px solid #e5ebe6;padding-top:15px;margin-top:60px;font-size:10px;color:#8c978f;display:flex;justify-content:space-between;gap:20px}.certificate{text-align:center;border:1px solid #d5b274;padding:35px 25px}.certificate h1{font-size:38px;max-width:450px;margin:15px auto}.ornament{color:#c5a164;margin:20px;font-size:26px}.recipient{font:italic 34px/1.3 Georgia,serif;color:#175c4d;overflow-wrap:anywhere;margin:15px 0 20px}.certificate p{color:#7a897f;font-size:13px}.certificate p strong{color:#365a47}.certificate .citation{max-width:440px;margin:24px auto}.certificate-meta{display:flex;justify-content:center;gap:35px;flex-wrap:wrap;margin:35px 0 10px}.certificate-meta .field{text-align:left}.certificate-signatures{display:flex;align-items:flex-end;justify-content:space-between;gap:25px;margin-top:65px}.certificate .certificate-signatures{margin-top:35px;text-align:left}.seal{border:2px solid #cfb279;border-radius:50%;width:92px;height:92px;font-size:8px;letter-spacing:1.4px;color:#ae8d4e;text-align:center;display:flex;justify-content:center;flex-direction:column;line-height:1.6}.seal b{font-size:20px;line-height:1.3}.tax-pending{background:#f2f6f2;border:1px solid #d9e5d9;border-radius:7px;padding:25px;margin-top:30px}.tax-pending strong{color:#175c4d}.tax-pending p{font-size:12px;color:#748478}.id-card{width:480px;max-width:100%;border:1px solid #d9e5dc;border-radius:14px;overflow:hidden;margin:40px auto;box-shadow:0 5px 25px #163e2812}.id-top{background:#175c4d;color:white;padding:18px 22px;display:flex;align-items:center;gap:12px}.id-top strong{font-size:16px;display:block}.id-top span{font-size:10px;opacity:.7}.id-body{display:flex;padding:30px 24px;gap:20px;align-items:center}.id-avatar{flex:0 0 85px;height:97px;border-radius:7px;background:#e7efe7;display:flex;align-items:center;justify-content:center;font-size:27px;color:#52755d}.id-body h2{font-size:22px;margin:0 0 5px;overflow-wrap:anywhere}.id-body p{font-size:11px;margin:0 0 9px;color:#89968b}.id-number{font-size:11px;letter-spacing:1.7px;font-weight:700}.id-bottom{background:#f5f7f2;padding:12px 22px;display:flex;justify-content:space-between;gap:10px;font-size:9px;color:#748373}.id-bottom b{letter-spacing:1px;color:#9f8245}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:25px;table-layout:auto}th{text-align:left;background:#edf4ed;color:#3a6149;font-weight:600}th,td{padding:10px 9px;border-bottom:1px solid #e5ebe5;overflow-wrap:anywhere;vertical-align:top}tr{break-inside:avoid}thead{display:table-header-group}@page{size:A4;margin:15mm}@media(max-width:700px){.toolbar{padding:12px 15px}.toolbar div{display:none}.page{margin:15px 10px;min-height:0;padding:30px 22px}.brand strong{font-size:15px}.sample-chip{font-size:8px}.meta-grid{gap:18px}.certificate{padding:25px 12px}.certificate h1{font-size:28px}.recipient{font-size:28px}.certificate-signatures{flex-wrap:wrap}.footer{flex-wrap:wrap}}@media print{body{background:white}.toolbar{display:none}.page{max-width:none;min-height:0;margin:0;padding:20px 25px;box-shadow:none}.brand{margin-bottom:25px}.footer{margin-top:45px}.certificate{break-inside:avoid}a{color:inherit;text-decoration:none}}
    .certificate{padding:26px 24px}.certificate h1{font-size:34px;margin:12px auto}.ornament{margin:10px;font-size:20px}.certificate p{font-size:12px;margin:10px 0}.recipient{font-size:32px;margin:8px 0 14px}.certificate .citation{margin:18px auto}.certificate-meta{margin:24px 0 0}.certificate .certificate-signatures{margin-top:26px}.seal{width:80px;height:80px}.verification{padding:12px 15px;margin-top:22px}.verification img{width:74px;height:74px}.footer{margin-top:35px}@media print{.brand{padding-bottom:20px;margin-bottom:24px}.footer{margin-top:28px}}
  `;


  let dismissDocumentPreview = null;
  function showDocumentPreview(title, html, type, data, brand, qr) {
    if (dismissDocumentPreview) dismissDocumentPreview();
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const overlay = document.createElement('div');
    overlay.id = 'foundation-document-preview';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label', title + ' preview');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#16392bb8;display:flex;align-items:center;justify-content:center;padding:22px;font-family:Inter,Arial,sans-serif';
    overlay.innerHTML = '<section style="display:flex;flex-direction:column;width:1050px;max-width:100%;height:94vh;max-height:1100px;border-radius:13px;overflow:hidden;background:#edf1ee;box-shadow:0 20px 80px #10291e55"><header style="background:#fff;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 21px;border-bottom:1px solid #dce6df;flex-wrap:wrap"><div><strong style="font-size:15px;color:#175c4d">'+esc(title)+'</strong><div style="font-size:10px;color:#7c8c81;margin-top:4px">Sample document · QR links to local verification preview</div></div><div style="display:flex;gap:7px;flex-wrap:wrap"><button data-document-control="pdf" style="border:0;border-radius:6px;padding:10px 14px;background:#175c4d;color:#fff;font-size:12px;font-weight:600;cursor:pointer">Download PDF</button><button data-document-control="print" style="border:1px solid #dce6df;border-radius:6px;padding:9px 12px;background:#fff;color:#175c4d;font-size:12px;cursor:pointer">Print</button><button data-document-control="html" style="border:1px solid #dce6df;border-radius:6px;padding:9px 12px;background:#fff;color:#175c4d;font-size:12px;cursor:pointer">Download HTML</button><button data-document-control="close" aria-label="Close document preview" style="border:1px solid #dce6df;border-radius:6px;padding:7px 11px;background:#f7f9f6;color:#365844;font-size:18px;cursor:pointer">×</button></div></header><div data-document-status role="status" style="padding:8px 21px;background:#f7f9f5;color:#788478;font-size:10px;line-height:1.4">Download PDF to save directly. If printing is unavailable here, download HTML and open it in your browser.</div><iframe title="'+esc(title)+' document" style="width:100%;flex:1;border:0;background:#edf1ee;min-height:0"></iframe></section>';
    const frame = overlay.querySelector('iframe');
    const status = overlay.querySelector('[data-document-status]');
    let removed = false;
    function close() {
      if (removed) return;
      removed = true;
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      document.body.style.overflow = previousOverflow;
      if (dismissDocumentPreview === close) dismissDocumentPreview = null;
      previousFocus?.focus?.();
    }
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
      if (event.key === 'Tab' && document.activeElement === overlay.querySelector('[data-document-control="close"]') && !event.shiftKey) { event.preventDefault(); overlay.querySelector('[data-document-control="pdf"]').focus(); }
      if (event.key === 'Tab' && document.activeElement === overlay.querySelector('[data-document-control="pdf"]') && event.shiftKey) { event.preventDefault(); overlay.querySelector('[data-document-control="close"]').focus(); }
    }
    overlay.querySelector('[data-document-control="close"]').onclick = close;
    overlay.onclick = event => { if (event.target === overlay) close(); };
    overlay.querySelector('[data-document-control="html"]').onclick = () => {
      download('seva-setu-'+type+'-'+(data.id || 'preview')+'.html', html, 'text/html;charset=utf-8');
      status.textContent = 'HTML file prepared. Open it in a browser and choose Print / Save as PDF for the full styled layout.';
    };
    overlay.querySelector('[data-document-control="pdf"]').onclick = () => {
      try {
        buildFoundationPDF(type,data,brand,qr);
        status.textContent = 'PDF file prepared. Check your downloads. The PDF is marked as a sample.';
      } catch (error) {
        status.textContent = 'PDF could not be prepared in this browser. Download HTML and open it in a browser to Print / Save as PDF.';
        if (typeof window.toast === 'function') window.toast('Use Download HTML if PDF is unavailable in this browser.');
        console.error('Foundation PDF generation failed:',error);
      }
    };
    overlay.querySelector('[data-document-control="print"]').onclick = () => {
      try { frame.contentWindow.focus(); frame.contentWindow.print(); status.textContent = 'If no print dialog opens, use Download PDF to save directly, or Download HTML to print in your browser.'; }
      catch (_) { status.textContent = 'Printing is unavailable here. Use Download PDF, or Download HTML and print it from a browser.'; }
    };
    frame.onload = () => { try { frame.contentDocument.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } }); } catch (_) {} };
    frame.srcdoc = html;
    document.body.appendChild(overlay);
    dismissDocumentPreview = close;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown',onKey,true);
    overlay.querySelector('[data-document-control="pdf"]').focus();
    return true;
  }

  function buildFoundationPDF(type, data, brand, qr) {
    if (!window.jspdf?.jsPDF) throw new Error('PDF library is unavailable');
    const isCard = type === 'id-card';
    const isCertificate = ['membership','volunteer','appreciation','participation'].includes(type);
    const doc = new window.jspdf.jsPDF({orientation:isCard || isCertificate ? 'landscape':'portrait',unit:'mm',format:isCard ? [85.6,54]:'a4'});
    const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
    const green = [23,92,77], gold = [176,139,72], gray = [113,129,118];
    const safe = value => String(value == null ? '' : value).replace(/₹/g,'INR ').replace(/[–—]/g,'-').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/✦/g,'*');
    const text = (value,x,y,size=10,color=green,font='helvetica',style='normal',options={}) => { doc.setFont(font,style); doc.setFontSize(size); doc.setTextColor(...color); doc.text(safe(value),x,y,options); };
    const lines = (value,width,size=10) => { doc.setFontSize(size); return doc.splitTextToSize(safe(value),width); };
    const addQR = (x,y,size) => { if (qr.dataURL) doc.addImage(qr.dataURL,'PNG',x,y,size,size); };
    const titleMap = {receipt:'Donation receipt',membership:'Membership certificate',volunteer:'Volunteer certificate',appreciation:'Certificate of appreciation',participation:'Certificate of participation',appointment:'Appointment letter','id-card':'Identity card','tax-request':'Tax certificate request',report:data.title || 'Foundation report'};
    const title = titleMap[type] || 'Foundation document';
    let y=0;
    function header(continuation=false) {
      doc.setFillColor(...green); doc.rect(0,0,w,3,'F');
      text(brand.name,20,20,15,green,'helvetica','bold');
      text(brand.tagline,20,26,8,gray);
      text(data.demo !== false ? 'SAMPLE DOCUMENT' : 'FOUNDATION RECORD',w-20,19,8,gold,'helvetica','bold',{align:'right'});
      doc.setDrawColor(220,230,221); doc.line(20,33,w-20,33);
      text(title+(continuation?' (continued)':''),20,47,22,green,'times'); y=58;
    }
    function paragraph(value,size=10,bold=false) {
      const parts=lines(value,w-40,size);
      for (const part of parts) { if(y>h-35){doc.addPage();header(true)} text(part,20,y,size,bold?green:gray,'helvetica',bold?'bold':'normal'); y+=size*.43; }
      y+=5;
    }
    function details(pairs) {
      for(const pair of pairs){if(y>h-35){doc.addPage();header(true)}text(pair[0].toUpperCase(),20,y,7.5,gray);text(lines(pair[1] || '-',w-78,10),74,y,10,green,'helvetica','bold');y+=Math.max(10,lines(pair[1] || '-',w-78,10).length*4.5+4)}y+=5;
    }
    if(isCard){
      doc.setFillColor(...green);doc.rect(0,0,w,14,'F');text(brand.name,5,7,9,[255,255,255],'helvetica','bold');text(data.type||data.role||'Foundation member',5,11,5.5,[209,228,213]);
      text(lines(data.name||'Cardholder',48,11).slice(0,2),5,23,11,green,'helvetica','bold');
      text(lines(data.department||data.role||'Community member',48,6.5).slice(0,2),5,32,6.5,gray);
      text(data.id||'DRAFT',5,39,6,green,'helvetica','bold');addQR(w-26,18,21);
      doc.setFillColor(241,246,239);doc.rect(0,44,w,10,'F');
      text('Valid until: '+(data.validity?date(data.validity):'To be confirmed'),5,48,5.4,gray);
      text('SAMPLE - '+statusFor(data),5,51.5,5.3,gold,'helvetica','bold');
      text('LOCAL PREVIEW',w-5,49,4.8,gray,'helvetica','bold',{align:'right'});
    } else if(isCertificate){
      doc.setDrawColor(...gold);doc.setLineWidth(.4);doc.rect(13,13,w-26,h-26);doc.rect(15,15,w-30,h-30);
      text(brand.name,w/2,33,16,green,'helvetica','bold',{align:'center'});
      text('RECOGNISING THE SPIRIT OF SEVA',w/2,43,8,gold,'helvetica','bold',{align:'center'});
      text(title,w/2,62,28,green,'times','normal',{align:'center'});
      text('This is to certify that',w/2,78,10,gray,'helvetica','normal',{align:'center'});
      text(lines(data.name||'Recipient',w-80,27).slice(0,2),w/2,96,27,green,'times','italic',{align:'center'});
      const body = data.description || (type==='membership'?'is a valued member of '+brand.name+', committed to community service and positive social change.':type==='volunteer'?'is recognised for their time, dedication, and contribution as a volunteer with '+brand.name+'.':type==='participation'?'participated in '+(data.event||data.project||'a community initiative')+' and contributed to a shared purpose.':'is appreciated for their support and contribution to the community.');
      text(lines(body,w-95,11).slice(0,4),w/2,115,11,gray,'helvetica','normal',{align:'center'});
      text('Reference: '+(data.id||'DRAFT'),26,150,8,gray);text('Issued: '+date(data.date),26,156,8,gray);
      if(data.validity)text('Valid until: '+date(data.validity),26,162,8,gray);
      if(data.hours)text('Service hours: '+data.hours,26,168,8,gray);
      doc.setDrawColor(176,190,178);doc.line(26,181,95,181);text('Authorised signature required',26,186,7,gray);
      addQR(w-57,147,27);text('Local verification preview',w-43.5,179,6,gray,'helvetica','normal',{align:'center'});
      text('SAMPLE - No legal validity. Verification uses same-browser demo records.',w/2,h-19,7,gold,'helvetica','bold',{align:'center'});
    } else {
      header();
      if(type==='report'){
        const rows=Array.isArray(data.rows)?data.rows:[];
        const headers=(Array.isArray(data.columns)&&data.columns.length?data.columns:Array.isArray(data.headers)&&data.headers.length?data.headers:rows.length&&!Array.isArray(rows[0])?Object.keys(rows[0]):['Description','Amount']);
        paragraph('Generated: '+date(data.date)+' | Records: '+rows.length,8);
        const cellWidth=(w-40)/headers.length;
        function tableHeader(){doc.setFillColor(235,243,236);doc.rect(20,y-5,w-40,10,'F');headers.forEach((key,index)=>text(lines(key,cellWidth-4,8),22+index*cellWidth,y,8,green,'helvetica','bold'));y+=10}
        tableHeader();
        for(const row of rows){const cells=headers.map((key,index)=>lines(Array.isArray(row)?row[index]:row?.[key],cellWidth-4,8));const rowH=Math.max(9,...cells.map(cell=>cell.length*3.6+4));if(y+rowH>h-27){doc.addPage();header(true);tableHeader()}cells.forEach((cell,index)=>text(cell,22+index*cellWidth,y,8,gray));y+=rowH;doc.setDrawColor(229,235,229);doc.line(20,y-4,w-20,y-4)}
        if(!rows.length)paragraph('No records available.');
      } else if(type==='receipt'){
        paragraph('Thank you for helping build a bridge to a better tomorrow.');
        details([['Receipt number',data.id||'DRAFT'],['Date',date(data.date)],['Donor',data.name],['Email',data.email],['Purpose',data.project||'General fund'],['Payment method',data.method||'Not recorded']]);
        doc.setFillColor(238,246,238);doc.roundedRect(20,y,w-40,28,3,3,'F');text('DONATION AMOUNT',27,y+9,8,gray);text(safe(money(data.amount)),27,y+21,23,green,'helvetica','bold');y+=42;
        paragraph('SAMPLE / NOT VALID FOR TAX CLAIMS.',10,true);paragraph('This demonstration receipt does not confirm a payment or establish eligibility for a tax deduction.');
      } else if(type==='tax-request'){
        paragraph('REQUEST SUMMARY - APPROVAL AND CERTIFICATE NUMBER PENDING',10,true);
        details([['Request reference',data.id||'DRAFT'],['Date',date(data.date)],['Donor',data.name],['Email',data.email],['Donation amount',money(data.amount)],['Project',data.project||'General fund']]);
        paragraph('This is not an 80G or tax exemption certificate. The foundation registration and donor eligibility require verification before an authorised certificate can be issued.');paragraph('NOT VALID FOR TAX CLAIMS.',11,true);
      } else if(type==='appointment'){
        paragraph('DRAFT - REQUIRES AUTHORISED REVIEW',9,true);
        details([['Reference',data.id||'DRAFT'],['Employee / member',data.name],['Position',data.role||data.position||'To be confirmed'],['Department',data.department||'To be confirmed'],['Joining date',data.joining?date(data.joining):'To be confirmed'],...(data.validity?[['Valid until',date(data.validity)]]:[])]);
        paragraph('Dear '+(data.name||'Recipient')+',');
        paragraph('We are pleased to propose your appointment as '+(data.role||data.position||'the position to be confirmed')+' with '+brand.name+', subject to approval and completion of the appointment process.');
        if(data.duties||data.responsibilities){paragraph('Role and responsibilities',10,true);paragraph(Array.isArray(data.duties||data.responsibilities)?(data.duties||data.responsibilities).join('; '):(data.duties||data.responsibilities));}
        paragraph(data.description||'Responsibilities, compensation, reporting arrangements, working hours, probation, and all other terms must be reviewed and agreed in the final appointment letter.');
        paragraph('DRAFT ONLY - Approval and signatures of the foundation and recipient are required.',9,true);
      }
      if(qr.dataURL){if(y+34>h-25){doc.addPage();header(true)}addQR(20,y,26);text(lines('Scan for a local verification preview. Same-browser demonstration data; not independent verification.',w-78,8),54,y+8,8,gray)}
      for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setDrawColor(226,233,226);doc.line(20,h-19,w-20,h-19);text('SAMPLE - Demonstration document. No legal or tax validity.',20,h-13,7,gold);text(page+' / '+doc.getNumberOfPages(),w-20,h-13,7,gray,'helvetica','normal',{align:'right'});}
    }
    doc.setProperties({title:title+' - '+brand.name,subject:'Sample foundation document',author:brand.name});
    const filename=('seva-setu-'+type+'-'+(data.id||'sample')).replace(/[^a-zA-Z0-9._-]/g,'-')+'.pdf';
    doc.save(filename);
    return true;
  }

  window.printFoundationDocument = function (type, data = {}, branding = {}) {
    const allowed = ['receipt','membership','volunteer','appreciation','participation','appointment','id-card','tax-request','report'];
    if (!allowed.includes(type)) type = 'report';
    const brand = {name:branding.name || 'Seva Setu Foundation',tagline:branding.tagline || 'Bridging hearts. Building communities.',address:branding.address || '',email:branding.email || ''};
    const sample = data.demo !== false;
    const titles = {receipt:'Donation receipt',membership:'Membership certificate',volunteer:'Volunteer certificate',appreciation:'Certificate of appreciation',participation:'Certificate of participation',appointment:'Draft appointment letter','id-card':'Foundation identity card','tax-request':'Tax certificate request',report:data.title || 'Foundation report'};
    const qr = ['receipt','tax-request','report'].includes(type) ? {image:'',html:''} : verification(data, branding);
    const content = type === 'receipt' ? receipt(data, sample) : ['membership','volunteer','appreciation','participation'].includes(type) ? certificate(type,data) : type === 'appointment' ? appointment(data) : type === 'id-card' ? idCard(data,brand,sample,qr) : type === 'tax-request' ? taxRequest(data) : report(data);
    const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(titles[type])+' · '+esc(brand.name)+'</title><style>'+css+'</style></head><body><div class="toolbar"><section><strong>'+esc(titles[type])+'</strong><div>Choose “Save as PDF” in the print dialog to download.</div></section><button type="button" id="print-document">Print / Save as PDF</button></div><main class="page"><header class="brand">'+logo+'<div><strong>'+esc(brand.name)+'</strong><span>'+esc(brand.tagline)+'</span></div>'+(sample ? '<b class="sample-chip">SAMPLE DOCUMENT</b>' : '')+'</header>'+content+qr.html+'<footer class="footer"><span>'+esc(brand.name)+(brand.address ? '<br>'+esc(brand.address) : '')+(brand.email ? '<br>'+esc(brand.email) : '')+'</span><span>'+(sample ? 'Demonstration document · no legal or tax validity' : type === 'tax-request' ? 'Request summary · not valid for tax claims' : type === 'appointment' ? 'Draft · approval and signatures required' : 'Generated from supplied foundation records')+'</span></footer></main><script>document.getElementById("print-document").addEventListener("click",function(){window.print()});<\/script></body></html>';
    return showDocumentPreview(titles[type], html, type, data, brand, qr);
  };

  function download(filename, content, mime) {
    const blob = new Blob([content], {type:mime});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = String(filename || 'seva-setu-export').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-');
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.downloadFoundationCSV = function (filename, rows) {
    const source = Array.isArray(rows) ? rows : [];
    let matrix;
    if (source.length && !Array.isArray(source[0]) && source[0] && typeof source[0] === 'object') {
      const keys = [...new Set(source.flatMap(row => Object.keys(row || {})))];
      matrix = [keys,...source.map(row => keys.map(key => row && row[key]))];
    } else matrix = source.map(row => Array.isArray(row) ? row : [row]);
    const cell = value => {
      let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
      return '"'+text.replace(/"/g,'""')+'"';
    };
    download((filename || 'seva-setu-export').replace(/\.csv$/i,'')+'.csv', '\uFEFF'+matrix.map(row => row.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  };

  window.downloadFoundationJSON = function (filename, data) {
    download((filename || 'seva-setu-backup').replace(/\.json$/i,'')+'.json', JSON.stringify(data,null,2), 'application/json;charset=utf-8');
  };
})();
