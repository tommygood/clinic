function jsonToString(json) {
    return Object.keys(json).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    }).join('&');
}
axios.get('/get', {
    params : {
        id : 5
    }
})

function getId(id) {
    return document.getElementById(id);
}

function alertLog(response) { // 登入
    for (let i = 0;i < response.data[response.data.length-1].length;i++) {
        console.log(response.data[response.data.length-1][i].status)
        if (response.data[response.data.length-1][i].status) 
            return 1;
        }
    var name = prompt("請輸入您的帳號", ""); //將輸入的內容賦給變數 name ，
    var pass = prompt("請輸入您的密碼", ""); //將輸入的內容賦給變數 name ，
    var log_suc = 0;
    for (let i = 0;i < response.data[response.data.length-1].length;i++) {
        if (response.data[response.data.length-1][i].nId==name && response.data[response.data.length-1][i].pass==pass) {
            //getId('nId').value = name;
            alert('登入成功');
            log_suc = 1;
            return 1;
        }
    }
    if (log_suc == 0) {
        alert('登入失敗');
        location.reload();
    }
}    

axios.get('/records').then(function(response) {
    axios.get('/data').then(function(data) {
        for (let j = 0;j < response.data.length;j++) { // 每一筆紀錄 
            for (let i = 0;i < data.data.length;i++) { // left join 到 patients
                if (response.data[j].pId == data.data[i].pId) {
                    tab.innerHTML += "<td>" + data.data[i].name +"</td>" +  
                    "<td>" + response.data[j].start + "</td>" +
                    "<td>" + response.data[j].end + "</td>" +
                    "<td>" + response.data[j].num + "</td>" +
                    "<td>" + data.data[i].id + "</td>" +
                    "<td>" + data.data[i].sex + "</td>" +
                    "<td>" + data.data[i].birth + "</td>" +
                    "<td>" + data.data[i].tel1 + "</td>" +
                    "<td>" + data.data[i].tel2 + "</td>" +
                    "<td>" + response.data[j].mark + "</td>" + 
                    "<td>" + response.data[j].regist + "</td>" +
                    "<td>" + response.data[j].self_part + "</td>" +
                    "<td>" + response.data[j].all_self + "</td>" +
                    "<td>" + response.data[j].deposit + "</td>" +
                    "<td>" + response.data[j].dId + "</td>" + 
                    "<td>" + response.data[j].in + "</td>";
                }
            }
        }
    })
})

axios.get('/data').then(function(response) {
    if (alertLog(response) == 1)
        getId('nurse').innerHTML = "<b>" + response.data[response.data.length-1][0].nId + '</b>號 護士登入中';
    /*for (let i = 0;i < response.data.length-1;i++) {
        tab.innerHTML += "<td>" + response.data[i].name +"</td>" +  
        "<td>" + response.data[i].times + "</td>" + 
        "<td>" + response.data[i].chart_num + "</td>" +
        "<td>" + response.data[i].id + "</td>" +
        "<td>" + response.data[i].sex + "</td>" +
        "<td>" + response.data[i].birth + "</td>" + 
        "<td>" + response.data[i].tel1 + "</td>" +
        "<td>" + response.data[i].tel2 + "</td>" +
        "<td>" + response.data[i].mark + "</td>" +
        "<td>" + response.data[i].regist + "</td>" +
        "<td>" + response.data[i].part_self + "</td>" +
        "<td>" + response.data[i].deposit + "</td>" +
        "<td>" + response.data[i].all_self + "</td>" +
        "<td>" + response.data[i].dId + "</td>";
    }*/
})
axios.post('/post', jsonToString({name:'post'}))