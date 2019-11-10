import React, { Component } from 'react';
import { Button, Form, Card } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import axios from "axios";

class Register extends Component {

  state = {
      name            : "",
      email           : "",
      password        : "",
      confirmPassword : "",

      address         : "",
      city            : "",
      postalCode      : "",
      phone           : "",

      redirectFlag    : false,
      message         : "",
      btnType         : undefined
    }

  handleChange = e => {
    if (e.key === "Enter")
      switch(e.target.name) {
        case "name":
          if (this.state.name !== "")
            this.textInput2.focus();
          break;
        case "email":
          if (this.state.email !== "")
            this.textInput4.focus();
          break;
        case "password":
          if (this.state.password !== "")
            this.textInput5.focus();
          break;
        case "confirmPassword":
          if (this.state.confirmPassword !== "")
            this.setState({ btnType: "submit" });
          break;
        default:                     
      }

      this.setState({
        [e.target.name]: e.target.value
      });
  }

  handleSubmit = async e => {
    e.preventDefault();

    if (this.state.name.length > 60) {
      alert("Name's maximun length is 60 characters.");
      this.textInput1.focus();
    } else if (this.state.email.length > 60) {
      alert("Email's maximun length is 60 characters.");
      this.textInput2.focus();
    } else if (this.state.email !== "" && this.state.name !== "") { // && this.state.password !== "" && this.state.confirmPassword !== "") {
      if ((this.state.password !== this.state.confirmPassword) || (this.state.password === "")) {
        alert("Password and \nConfirm Password fields\n\nMUST be the same\n and NOT empty.");
        this.setState({
          password        : "",
          confirmPassword : ""
        })
        this.textInput4.focus();
      } else {
        // const url = "/user/signup";
        const url         = "http://localhost:3333/user/signup";    // this is dev setting
        const createUser  = {
          name        : this.state.name,
          email       : this.state.email,
          password    : this.state.password,

          address     : this.state.address,
          city        : this.state.city,
          postalCode  : this.state.postalCode,
          phone       : this.state.phone
        }
console.log("createUser", createUser);
        try {
          const addUser = await axios.post(url, createUser);
console.log("addUser", addUser);
          if (addUser.data.message) {
console.log("inside ok")            
            const user = {
              id      : addUser.data.user._id,
              name    : addUser.data.user.name,
              email   : addUser.data.user.email,
              token   : addUser.data.token,

              address     : addUser.data.user.address,
              city        : addUser.data.user.city,
              postalCode  : addUser.data.user.postalCode,
              phone       : addUser.data.user.phone
            }; 
            this.props.dispatchLogin({ user });
            this.setState({
              redirectFlag: true
            });
          } else if (addUser.data.error) {
console.log("inside NOKKKKK")
            this.setState({
              message : addUser.data.error });
            this.clearMessage();
          }

        } catch(err) {
console.log("inside catcherror")
          this.setState({
            message : err.message });
          this.clearMessage();
        }
      }
    }
  }


  //it clears the error message after 3.5s
  clearMessage = () => {
    setTimeout(() => {
      this.setState({
        message         : "",
        password        : "",
        confirmPassword : ""
      })
      this.textInput1.focus();
    }, 3500);

  }

  render() {

    if (this.state.redirectFlag)
      return(<Redirect to="/" />);

    return (
      <div>
        <h1>Register ClockinJS User Page</h1>
        <Card>
          <Form onSubmit={this.handleSubmit}>

            <Form.Group controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                autoFocus   = {true}
                type        = "text"
                placeholder = "Type the user's name"
                name        = "name"
                onChange    = {this.handleChange}
                value       = {this.state.name}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput1 = input }
              />
            </Form.Group>

            <Form.Group controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type        = "email"
                placeholder = "Type the user's email"
                name        = "email"
                onChange    = {this.handleChange}
                value       = {this.state.email}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput2 = input }
              />
            </Form.Group>


            <Form.Group controlId="formCity">
              <Form.Label>City</Form.Label>
              <Form.Control
                type        = "text"
                placeholder = "Type the user's city"
                name        = "city"
                onChange    = {this.handleChange}
                value       = {this.state.city}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput3 = input }
              />
            </Form.Group>

            <Form.Group controlId="formAddress">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type        = "text"
                placeholder = "Type the user's address"
                name        = "address"
                onChange    = {this.handleChange}
                value       = {this.state.address}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput4 = input }
              />
            </Form.Group>

            <Form.Group controlId="formPostalCode">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control
                type        = "text"
                placeholder = "Type the user's Postal Code"
                name        = "postalCode"
                onChange    = {this.handleChange}
                value       = {this.state.postalCode}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput5 = input }
              />
            </Form.Group>

            <Form.Group controlId="formPhone">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type        = "text"
                placeholder = "Type the user's phone"
                name        = "phone"
                onChange    = {this.handleChange}
                value       = {this.state.phone}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput6 = input }
              />
            </Form.Group>            


            <Form.Group controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type        = "password"
                placeholder = "Password"
                name        = "password"
                onChange    = {this.handleChange}
                value       = {this.state.password}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput7 = input }
              />
            </Form.Group>


            {/* textInput4 would be phone, but not using it in this app */}


            <Form.Group controlId="formConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type        = "password"
                placeholder = "Confirm Password"
                name        = "confirmPassword"
                onChange    = {this.handleChange}
                value       = {this.state.confirmPassword}
                onKeyPress  = {this.handleChange}
                ref         = {input => this.textInput8 = input }
                />
            </Form.Group>


            { /* mount the Dropbox Button with all clients for the user */ }
          <div className="gridClientBtContainer">
            <span></span>
            <Button 
              variant = "primary" 
              type    = {this.state.btnType}
              onClick = {this.handleSubmit}>
              Submit
            </Button>

            <span className="messageSettings">
              {this.state.message }
            </span>
          </div>
<br></br>
<br></br>

          </Form>
          </Card>
      </div>
    )
  }
}


const mapDispatchToProps = dispatch => {
  return {
    dispatchLogin: user => dispatch({
      type:"LOGIN",
      data: user })
  }
}

export default connect(null, mapDispatchToProps)(Register)
