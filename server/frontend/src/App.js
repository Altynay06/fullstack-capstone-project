import Auth from './components/Register/Register';
import React, {useEffect, useState} from 'react';
import {Routes, Route, Link, useNavigate, useParams} from 'react-router-dom';
import './App.css';

async function api(url, body) {
  if (body) await fetch('/djangoapp/session');
  const csrf = document.cookie.split('; ').find(x=>x.startsWith('csrftoken='))?.split('=')[1] || '';
  const response = await fetch('/djangoapp/' + url, body ? {method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':csrf}, body:JSON.stringify(body)} : {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function App() {
  const [user, setUser] = useState(sessionStorage.getItem('username') || '');
  const navigate = useNavigate();
  useEffect(()=>{api('session').then(data=>{setUser(data.userName); if(data.userName) sessionStorage.setItem('username',data.userName); else sessionStorage.removeItem('username');}).catch(()=>{});},[]);
  const signedIn = data => {sessionStorage.setItem('username', data.userName); setUser(data.userName); navigate('/');};
  const signOut = async () => {try {await api('logout',{}); sessionStorage.removeItem('username'); setUser(''); window.alert('You have been logged out.'); navigate('/');} catch(e) {window.alert(e.message);}};
  return <><header><Link className="brand" to="/">Best Cars</Link><nav><Link to="/">Dealerships</Link><a href="/about">About Us</a><a href="/contact">Contact Us</a></nav><div>{user ? <><strong>{user}</strong> <button onClick={signOut}>Logout</button></> : <><Link to="/login">Login</Link> · <Link to="/register">Sign up</Link></>}</div></header>
  <main><Routes>
    <Route path="/" element={<Dealers user={user}/>}/>
    <Route path="/login" element={<Auth signedIn={signedIn}/>}/>
    <Route path="/register" element={<Auth register signedIn={signedIn}/>}/>
    <Route path="/dealer/:id" element={<Dealer user={user}/>}/>
    <Route path="/postreview/:id" element={<Review user={user}/>}/>
    <Route path="*" element={<><h1>Page not found</h1><Link to="/">Return home</Link></>}/>
  </Routes></main><footer>Best Cars · Full Stack Capstone Project</footer></>;
}

function Dealers({user}) {
  const [dealers,setDealers]=useState([]); const [state,setState]=useState('All'); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
  useEffect(()=>{api('get_dealers').then(data=>setDealers(data.dealers)).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  const states=[...new Set(dealers.map(x=>x.state))].sort();
  return <><h1>Find a dealership</h1><p>Explore dealerships and read reviews from car buyers.</p><label>Filter by state <select value={state} onChange={e=>setState(e.target.value)}><option>All</option>{states.map(x=><option key={x}>{x}</option>)}</select></label>{error&&<p role="alert">{error}</p>}{loading?<p>Loading dealerships…</p>:<div className="table-wrap"><table><thead><tr><th>ID</th><th>Dealer</th><th>City</th><th>Address</th><th>ZIP</th><th>State</th>{user&&<th>Review</th>}</tr></thead><tbody>{dealers.filter(x=>state==='All'||x.state===state).map(x=><tr key={x.id}><td>{x.id}</td><td><Link to={'/dealer/'+x.id}>{x.full_name}</Link></td><td>{x.city}</td><td>{x.address}</td><td>{x.zip}</td><td>{x.state}</td>{user&&<td><Link to={'/postreview/'+x.id}>Post Review</Link></td>}</tr>)}</tbody></table></div>}</>;
}
function Dealer({user}) {
  const {id}=useParams(); const [dealer,setDealer]=useState(null); const [reviews,setReviews]=useState(null); const [error,setError]=useState('');
  useEffect(()=>{setReviews(null);setError('');Promise.all([api('dealer/'+id),api('reviews/dealer/'+id)]).then(([d,r])=>{setDealer(d.dealer[0]);setReviews(r.reviews);}).catch(e=>setError(e.message));},[id]);
  return <>{error?<p role="alert">{error}</p>:!dealer?<p>Loading dealership…</p>:<><h1>{dealer.full_name}</h1><p>{dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}</p>{user?<Link className="button" to={'/postreview/'+id}>Post Review</Link>:<p><Link to="/login">Login</Link> to write a review.</p>}<h2>Customer reviews</h2>{reviews?.length===0&&<p>No reviews yet.</p>}<div className="cards">{reviews?.map(r=><article key={r.id}><span className={'sentiment '+r.sentiment}>{r.sentiment}</span><p>{r.review}</p><strong>{r.name}</strong><p>{r.car_make} {r.car_model} · {r.car_year}</p><small>Purchase date: {r.purchase_date}</small></article>)}</div></>}</>;
}
function Review({user}) {
  const {id}=useParams(); const navigate=useNavigate(); const [cars,setCars]=useState([]); const [dealer,setDealer]=useState(null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  useEffect(()=>{Promise.all([api('dealer/'+id),api('get_cars')]).then(([d,c])=>{setDealer(d.dealer[0]);setCars(c.CarModels);}).catch(e=>setError(e.message));},[id]);
  async function submit(e) {e.preventDefault();setBusy(true);const values=Object.fromEntries(new FormData(e.currentTarget));const car=cars[Number(values.car)];try {await api('add_review',{...values,dealership:Number(id),purchase:true,car_make:car.CarMake,car_model:car.CarModel});navigate('/dealer/'+id);} catch(e){setError(e.message);setBusy(false);}}
  if (!user) return <p>Please <Link to="/login">login</Link> before posting a review.</p>;
  return <section className="form"><h1>Post Review</h1><h2>{dealer?.full_name}</h2><form onSubmit={submit}><label>Your review<textarea required name="review" rows="5"/></label><label>Purchase date<input required type="date" name="purchase_date" max={new Date().toISOString().slice(0,10)}/></label><label>Car make and model<select required name="car" defaultValue=""><option value="" disabled>Choose a car</option>{cars.map((c,i)=><option key={i} value={i}>{c.CarMake} {c.CarModel}</option>)}</select></label><label>Car year<input required name="car_year" type="number" min="2015" max="2023"/></label>{error&&<p role="alert" className="error">{error}</p>}<button disabled={busy||!cars.length}>{busy?'Posting…':'Submit Review'}</button></form></section>;
}
export default App;
