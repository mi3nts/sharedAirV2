import React from "react";
import "./taskBarStyle.css"; // Import the CSS file
import logoImageLoc from "../assets/MINTSLogo.jpeg";

function TaskBar(): JSX.Element {
  return (
    <nav className="navbar bg-body-tertiary">
      <div className="container-fluid">
        <a className="navbar-brand" href="#">
          <img
            src={logoImageLoc}
            alt="Logo"
            width="30"
            height="30"
            className="d-inline-block align-text-top"
          />
          Bootstrap
        </a>
        <li className="nav-item dropdown">
          <a
            className="nav-link dropdown-toggle"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Dropdown link
          </a>
          <ul className="dropdown-menu">
            <li>
              <a className="dropdown-item" href="#">
                Action
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Another action
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                Something else here
              </a>
            </li>
          </ul>
        </li>
      </div>
    </nav>
  );
}

export default TaskBar;
