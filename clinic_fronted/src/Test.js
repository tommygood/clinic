import React from 'react';

function TestFunc(props) {
    return <div>{props.name}<br/>{props.pig}</div>
}

function MakeName(name) {
    var new_name = name.map(function (value, index) {
        const new_value = value + 1;
        return <li id = {index} key = {index}>{new_value}</li>
    })
    return <div>{new_name}</div>
}

function detectInput(e) {
    console.log(e.target.value);
}

class Test2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            num : 5,
            name : ['a', 'b', 'c']
        };
    }
    
    insert_text = (e) => { //利用本身事件(e)找到自己
        // console.log(e.target.value);
        this.state.name.push(e.target.value); //把字串放到陣列
        this.setState({
          name:this.state.name //更新State
        })
        console.log(this.state.name);//印出State.item狀態
       
    }
    
    insert_texts = (name) => {
        console.log(name + this.state.name);
    }
    
    render() {
        const each_name = MakeName(this.state.name);
        return (
            <div>
                Test :
                {this.state.name}
                <TestFunc name = {this.state.name} pig = {this.state.num}/>
                {each_name}
                {this.insert_texts('a')}
                <input type = 'text' onChange = {this.insert_text}/>
            </div>
        )
    }
}

class Test3 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            num : 6,
            name : 'y123'
        };
    }
    
    render() {
        return (
            <div>
                Test :
            </div>
        )
    }
}

export {
    Test2,
    Test3
}