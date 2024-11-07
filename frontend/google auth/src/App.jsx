import './App.css'

function navigate(url){
  window.location.href = url;
}

async function auth(){
  const response =await fetch('http://127.0.0.1:3000/request',{method:'post'});

  const data = await response.json();
  console.log(data);
  navigate(data.url);

}


function App() {


  return (
    <>
<h1>Welcome to Consulting Ninja!</h1>
<h3>Google OAuth!</h3>
<p>Visit <a href="https://www.youtube.com/@ConsultingNinja/featured"><strong>@ConsultingNinja</strong></a> to see more great videos!</p>

<button className="btn-auth"  type="button" onClick={()=> auth()}>
          Sign In
            </button>
    </>
  )
}

export default App