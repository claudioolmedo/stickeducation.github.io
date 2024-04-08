<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCmKB-3GsdM0kYuSups-wO047quU1YE9TQ",
    authDomain: "https://stick-d4f7b-default-rtdb.firebaseio.com/",
    projectId: "stick-d4f7b",
    storageBucket: "stick-d4f7b.appspot.com",
    messagingSenderId: "459914689023",
    appId: "1:459914689023:web:e041f4ea739c226081cfca",
    measurementId: "G-2X8EWV9H66"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>