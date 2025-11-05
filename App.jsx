import React, { useEffect, useState, useRef } from 'react';
/*
Peculiar — Frontend (simplified)
- Uses Firebase for auth + storage (placeholders)
- Paystack inline checkout is kept for convenience. To prefer Nigeria bank transfers,
  configure Paystack to accept 'bank' channels or use Paystack Transfer APIs for payouts.
*/
const PAYSTACK_PUBLIC_KEY = "pk_test_replace_me";

export default function App(){
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const videoRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files?.[0] || null);
    if(e.target.files?.[0] && videoRef.current){
      videoRef.current.src = URL.createObjectURL(e.target.files[0]);
    }
  }

  const tipOwner = (amountNaira) => {
    if(!window.PaystackPop){
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.onload = () => openPaystack(amountNaira);
      document.body.appendChild(s);
    } else openPaystack(amountNaira);
  }

  const openPaystack = (amount) => {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: 'guest@peculiar.app',
      amount: amount*100,
      ref: 'peculiar_'+Date.now(),
      onClose: function(){ alert('Payment closed'); },
      callback: function(response){ alert('Payment successful. Reference: '+response.reference + '\nReminder: verify server-side (backend) before crediting owner wallet.'); }
    });
    handler.openIframe();
  }

  return (
    <div style={{maxWidth:900,margin:'24px auto',padding:16}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>Peculiar</h1>
        <small style={{color:'#666'}}>Built with ChatGPT</small>
      </header>

      <section style={{marginTop:16,display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:'#fff',padding:12,borderRadius:8}}>
          <h3>Upload</h3>
          <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%',padding:8}} />
          <input type="file" accept="video/*" onChange={handleFile} style={{marginTop:8}} />
          {file && <video ref={videoRef} controls style={{width:'100%',marginTop:8}} />}
          <p style={{fontSize:13,color:'#555'}}>Note: This starter app stores raw uploads. For production, add server-side transcoding and thumbnails.</p>
        </div>

        <div style={{background:'#fff',padding:12,borderRadius:8}}>
          <h3>Feed</h3>
          <p style={{color:'#555'}}>No videos yet. Tip the owner to show support (owner receives all tips).</p>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>tipOwner(100)} style={{padding:'8px 12px'}}>Tip ₦100</button>
            <button onClick={()=>tipOwner(500)} style={{padding:'8px 12px'}}>Tip ₦500</button>
          </div>
          <hr style={{margin:'12px 0'}}/>
          <h4>Payments (Nigeria bank transfers)</h4>
          <p style={{fontSize:13,color:'#666'}}>To accept direct Nigerian bank transfers, configure Paystack/Flutterwave in your dashboard to enable bank transfer channels. You can also provide a displayed bank account (manual transfer) or generate unique Paystack bank accounts per user (advanced).</p>
        </div>
      </section>

      <footer style={{marginTop:24,textAlign:'center',color:'#888'}}>
        <small>Peculiar — Copyright © you. Built with ChatGPT.</small>
      </footer>
    </div>
  )
}
