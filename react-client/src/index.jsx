import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Login from './components/Login.jsx';
import Student from './components/Student.jsx';
import Instructor from './components/Instructor.jsx';
import axios from 'axios';

const io = require('socket.io-client');
const socket = io();

var countdownInterval;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view: '',
      tokenId: '',
      lectureStatus: 'lectureNotStarted',
      lectureId: '',
      questionId:'',
      thumbValue: 2,
      countdown: 10
    }
  }

  componentDidMount() {
    this.setState({ view: 'login' });
  }

  onSignIn(googleUser) {
    let tokenId = googleUser.tokenId;
    axios({
      method: 'get',
      url: '/login',
      params: {
        tokenId: tokenId
      }
    })
    .then(result => {
      if (result.data[0].user_type === 'STUDENT') {
        this.setState({ view: 'student'});
      } else if (result.data[0].user_type === 'INSTRUCTOR') {
        this.setState({ view: 'instructor'});
      }
      socket.emit('username', { username: googleUser.profileObj.email })
      if(result.data[0].user_type === 'INSTRUCTOR'){
        socket.emit('instructor', { username: googleUser.profileObj.email })
      }
    });

  }

  startLecture (lectureId) {
    this.setState({
      lectureStatus: 'lectureStarted',
      lectureId: lectureId,
    })
  }

  endLecture () {
    let lectureId = this.state.lectureId;
    console.log(lectureId);
    axios({
      method: 'post',
      url: '/endLecture',
      params: {
        lectureId: lectureId
      }
    }).then((result) => {
      this.setState({
        lectureStatus: 'lectureNotStarted',
        lectureId: ''
      })
    })
  }
  //tell the student to go to the lectureNotStarted state

  endLectureStudent () {
    this.setState({
      lectureStatus: 'lectureNotStarted'
    })
  }

  setCountdownInterval () {
    countdownInterval = setInterval (() => {
      this.state.countdown === 0
      ? this.clearCountdownInterval()
      : this.setState({ countdown: this.state.countdown - 1 }, () => {
        console.log('this.state.countdown', this.state.countdown);
        if (this.state.view === 'student') {
          socket.emit('thumbValue', { thumbValue: this.state.thumbValue });
        }
      });
    }, 1000)
  }

  clearCountdownInterval () {
    clearInterval(countdownInterval);
    if (this.state.view === 'student') {
      this.setState({
        lectureStatus: 'lectureStarted',
        questionId: '',
        countdown: 10
      })
    }
  }

  startThumbsCheck (questionId) {
    this.setState({
      lectureStatus: 'checkingThumbs',
      questionId: questionId
    }, this.setCountdownInterval)
  }

  endThumbsCheck () {
    this.setState({
      lectureStatus: 'lectureStarted',
      questionId: ''
    })
  }

  clearThumbsCheck () {
    this.setState({
      lectureStatus: 'lectureStarted',
      questionId: '',
      countdown: 10
    })
  }

  changeThumbValue (value) {
    this.setState({
      thumbValue: value
    })
  }


  render () {
    return (
      <div>
        <div className="nav">
          <i className="fa fa-thumbs-o-up" aria-hidden="true"></i>
          <span className="nav-brand">ThumbsCheck</span>
        </div>
        <div className="wrapper">
            {this.state.view === 'login'
              ? <Login onSignIn={this.onSignIn.bind(this)}/>
              : this.state.view === 'student'
              ? <Student thumbValue={this.state.thumbValue} changeThumbValue={this.changeThumbValue.bind(this)} startThumbsCheck={this.startThumbsCheck.bind(this)} startLecture={this.startLecture.bind(this)} lectureStatus={this.state.lectureStatus} countdown={this.state.countdown} view={this.state.view} endLectureStudent={this.endLectureStudent.bind(this)} />
            : <Instructor thumbValue={this.state.thumbValue} lectureId={this.state.lectureId} lectureStatus={this.state.lectureStatus} startLecture={this.startLecture.bind(this)} endLecture={this.endLecture.bind(this)} startThumbsCheck={this.startThumbsCheck.bind(this)} countdown={this.state.countdown} changeThumbValue={this.changeThumbValue.bind(this)} clearThumbsCheck={this.clearThumbsCheck.bind(this)} view={this.state.view} /> }
        </div>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
