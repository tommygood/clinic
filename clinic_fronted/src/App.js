import logo from './logo.svg';
import './App.css';
import React from 'react';
import Sid from './Sid';
import {Test2, Test3} from './Test';
import { BrowserRouter, Routes, Route } from "react-router-dom";



function Test(props) {
    return <h2>hello {props.name}</h2>;
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            test : 'tommy'
        };
    }
    
    render() {
        const a = 1+1+'3';
        const test_element = <h1>hello worlddd</h1>;
        console.log('this.props.text',this.props.text);
        console.log('test');
        
        return(
            <BrowserRouter basename="/pig">
            <Routes>
              <Route path="/" element={<Sid />} />
              <Route path="page1" element={<Test2 />} />
              <Route path="*" element={<Test3 />} />
            </Routes>
            </BrowserRouter>
        )
    }
}

export default App;
