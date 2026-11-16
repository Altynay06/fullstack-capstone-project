import React, {useState} from 'react';
import {Link} from 'react-router-dom';
async function api(url, body) {
  if (body) await fetch('/djangoapp/session');
  const csrf = document.cookie.split('; ').find(x=>x.startsWith('csrftoken='))?.split('=')[1] || '';
  const response = await fetch('/djangoapp/' + url, body ? {method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':csrf}, body:JSON.stringify(body)} : {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export default function Register({register=false,signedIn}) {
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const fields=Object.fromEntries(new FormData(e.currentTarget));
    try {signedIn(await api(register?'register':'login',fields));} catch(e) {setError(e.message);} finally {setBusy(false);}
  }
  return <section className="form"><h1>{register?'Create an account':'Login'}</h1><form onSubmit={submit}>
    {register && <><label>First name<input required name="firstName" autoComplete="given-name"/></label><label>Last name<input required name="lastName" autoComplete="family-name"/></label><label>Email<input required type="email" name="email" autoComplete="email"/></label></>}
    <label>Username<input required name="userName" autoComplete="username"/></label>
    <label>Password<input required type="password" name="password" minLength={register?8:undefined} autoComplete={register?'new-password':'current-password'}/></label>
    {error && <p role="alert" className="error">{error}</p>}<button disabled={busy}>{busy?'Please wait…':register?'Sign up':'Login'}</button>
  </form>{!register&&<p>New here? <Link to="/register">Create an account</Link></p>}</section>;
}
