import { useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Folder from "./components/home/Folder.jsx";
import Login from "./components/account/Login.jsx";
import SignUp from "./components/account/SignUp.jsx";
import Team from "./components/home/Team.jsx";
import ProtectedRoute from "./components/home/ProtectedRoute.jsx";
import Shared from "./components/home/Shared.jsx";
import UpdateNames from "./components/account/UpdateNames.jsx";
import LawyerTerms from "./components/home/body/LawyerTerms.jsx";
import ImageAnnotator from "./components/home/ImageAnnotator.jsx";
import ImageView from "./components/home/ImageView.jsx";
import Forgot from "./components/account/Forgot.jsx";
import Reset from "./components/account/Reset.jsx";
import {configg} from "./components/utils/files/config.js";
import MyComputer from "./components/home/MyComputer.jsx";

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
        {
            configg() ? (
                <>
                    <Route path="/:folderId?"
                           element={
                               <MyComputer />
                           }
                    />
                    <Route path="/collaboration/:folderId?"
                           element={
                               <ProtectedRoute>
                                   <Folder />
                               </ProtectedRoute>
                           }
                    />
                </>
            ) : (
                <Route path="/:folderId?"
                       element={
                           <ProtectedRoute>
                               <Folder />
                           </ProtectedRoute>
                       }
                />
            )
        }

        <Route path="/teams"
               element={
                   <ProtectedRoute>
                       <Team />
                   </ProtectedRoute>
               }
        />

        <Route path="/sharedFiles/:folderId?"
               element={
                   <ProtectedRoute>
                       <Shared />
                   </ProtectedRoute>
               }
        />

        <Route path="/update_profile"
               element={
                   <ProtectedRoute>
                       <UpdateNames />
                   </ProtectedRoute>
               }
        />

        <Route path="/image" element={<ImageAnnotator />} />
        <Route path="/annotation/:cat/:fileId" element={<ImageView />} />

        <Route path="/login" element={<Login />} />
        <Route path="/sign_up" element={<SignUp />} />
        <Route path="/terms_and_privacy" element={<LawyerTerms />} />

        <Route path="/forgot_password" element={<Forgot />} />
        <Route path="/reset_password/:userId?" element={<Reset />} />

    </Routes>
  )
}

export default App
