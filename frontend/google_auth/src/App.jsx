import { useEffect, useState } from "react";
import "./App.css";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

function navigate(url) {
  window.location.href = url;
}

async function auth() {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/request`, {
    method: "post",
  });

  const data = await response.json();
  console.log(data);
  navigate(data.url);
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log("use effect ran");
    const idtoken = Cookies.get("id_token");
    console.log("idtoken", idtoken);

    console.log(idtoken);

    if (idtoken) {
      const decoded = jwtDecode(idtoken);
      console.log("decoded: ", decoded);
      setUser({
        name: decoded.name,
        picture: decoded.picture,
        email: decoded.email,
      });
    }
  }, []);

  return (
    <>
      <h1>Welcome to Practice Google Auth Sign In!</h1>
      {user ? (
        <div>
          {user.name}
          <div>{user.email}</div>
          <img src={user.picture} />
          <div>
            <button
              className="btn-auth"
              type="button"
              onClick={async () => {
                // Call backend to clear cookies
                await fetch(`${import.meta.env.VITE_BACKEND_URL}/logout`, {
                  method: "POST",
                  credentials: "include", // Ensure cookies are sent
                });
                setUser(null);
                // Cookies.remove("id_token");
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-auth" type="button" onClick={() => auth()}>
          Sign In
        </button>
      )}
    </>
  );
}

export default App;
