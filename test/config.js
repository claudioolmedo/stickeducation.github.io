/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

var config = {
  apiKey: "AIzaSyCt0IhN37bwI1Gp4xPBmhq8FY9bgrfrydM",
  authDomain: "stickeducation-27116.firebaseapp.com",
  databaseURL: "https://stickeducation-27116-default-rtdb.firebaseio.com",
  projectId: "stickeducation-27116",
  storageBucket: "stickeducation-27116.appspot.com",
  messagingSenderId: "566576954504",
  appId: "1:566576954504:web:fa4f51202373ba6c30733d"
};
firebase.initializeApp(config);


// Google OAuth Client ID, needed to support One-tap sign-up.
// Set to null if One-tap sign-up is not supported.
var CLIENT_ID =
    'YOUR_OAUTH_CLIENT_ID';
