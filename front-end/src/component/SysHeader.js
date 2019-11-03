import React, { Component } from 'react'
import { Navbar, Nav, NavDropdown, Button } from "react-bootstrap";
import { Link, Redirect } from "react-router-dom";
import { connect } from "react-redux";

class SysHeader extends Component {

  // function to set no user thus closing the user's session
  logout = () => {
    if (window.confirm("Are you sure you wanna leave?"))
      this.props.noUser()
  }

  x = e => {
    console.log("eee: ", e);
    return(<Redirect to = "/land" />);
    // this.props.history.push("/land");
    // return(<a href="land"></a>)
    // return <Link to = "/punchInNew" className="dropdown-item"> Punch In </Link>
  }

  // when a user is logged
  loggedHeader = () => {
    return (
      <Navbar bg="primary" >
        {/* <Navbar.Brand href="/">ClockinJS</Navbar.Brand> */}
        <Navbar.Brand>
          <Link to = "/" className="navbar-brand"> ClockinJS </Link>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Link to="/" className="nav-link">{this.props.storeEmail} is logged</Link>
            <NavDropdown title="Clients" id="basic-nav-dropdown1">
              {/* <NavDropdown.Item href="clientNew">Add New One</NavDropdown.Item> */}
              {/* <NavDropdown.Item> */}
              <Link to = "/clientNew" className="dropdown-item"> Add New One </Link>
              {/* </NavDropdown.Item> */}
              <NavDropdown.Divider />
              <Link to = "/clientList" className="dropdown-item"> List them all </Link>
            </NavDropdown>

            <NavDropdown title="Clockins" id="basic-nav-dropdown2">
              {/* <NavDropdown.Item href="punchInNew" onClick={this.x}>Punch in</NavDropdown.Item> */}
              <NavDropdown.Item onClick={this.x}>Punch in</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="punchInsList">List them all</NavDropdown.Item>
            </NavDropdown>

            <NavDropdown title="Invoices" id="basic-nav-dropdown3">
              <NavDropdown.Item href="invoiceNew">Generate a brand new one</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="invoicesList">List them all</NavDropdown.Item>
            </NavDropdown>            
          </Nav>

          <Button onClick={this.logout} className="logoutBtn">Logout</Button>

        </Navbar.Collapse>

      </Navbar>
    );
  }


  notLoggedHeader = () => {
    return (
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="/">ClockinJS</Navbar.Brand>
        <Nav>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link">Register</Link>
        </Nav>
      </Navbar>
    );
  }

  render() {
    return(this.props.storeEmail ?
            this.loggedHeader() :
            this.notLoggedHeader()
          );
  }
}

const mapStateToProps = store => {
  return {
    storeEmail: store.email
  }
};

const mapDispatchToProps = dispatch => {
  return {
    noUser: () => dispatch({type:"LOGOUT"})
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(SysHeader);