function getId(id) {
    return document.getElementById(id);
}

var all_no = []; // 全部快捷的編號
var all_real = []; // 全部的真實名稱
var all_rela = []; // 全部的對應快捷
async function putKey() { // 把目前的快捷對應放進 table
    const {data : hot_key} = await axios.get('/hot_key');
    // 清空
    all_no = []; 
    all_real = [];
    all_rela = []; 
    for (let i = 0;i < hot_key.length;i++) {
        // 放入 table
        tab.innerHTML +=  
        "<tr/><td/>"+ hot_key[i].no  + 
            "<td>" + hot_key[i].real_name + "</td>" +
            "<td>" + hot_key[i].relative + "</td></tr>";
        // 放入 array
        all_no.push(hot_key[i].no);
        all_real.push(hot_key[i].real_name);
        all_rela.push(hot_key[i].relative);
    }
    getId('search').addEventListener('change', checkSearch);
};
putKey();

const total_cols = 15; // 總共新增快捷的行數
function mkInsertColumns() { // 製作要新增快捷的欄位
    for (let i = 0;i < total_cols;i++) {
        insert.innerHTML +=  
        "<tr/><td/><input id = 'real_" + i + "'></input>" +
        "<td id = 'pointTo'>========></td>" + 
            "<td><input id = 'rela_" + i + "'></input></td></tr>";
    }
    insert.innerHTML += 
    "<tr><td colspan = '3'><button id = 'submit'>送出</button></td></tr>";
    getId('submit').addEventListener('click', submitInsert);
}
mkInsertColumns();

async function submitInsert(e) { // 送出新增的快捷
    var data = []; // 總共的新增
    for (let i = 0;i < total_cols;i++) { // 放入要新增的資料
        if (getId('real_'+i).value == "" || getId('rela_'+i).value == "") { // 真實名稱或對應欄位有一個是空白
            continue; // 找下一行
        }
        else {
            data.push([getId('real_'+i).value, getId('rela_'+i).value]);
        }
    }
    const {data : result} = await axios.post('/hot_key', {data : data});
    if (result.suc) { // 新增成功
        alert('新增成功！');
        window.location.reload();
    }
    else {
        alert('新增失敗！');
    }
}

function checkSearch() {
    getId('search').addEventListener('change', checkSearch);
    // 搜尋條件是否為空的
    if (getId('search').value == "" || getId('search').value == " ") {
        // 先清空 table
        tab.innerHTML = 
        "<tr><td class = 'col_title' colspan = '3'><b>目前快捷</b>" + 
        "<span class = 'position-absolute top-0 end-0' id = 'search_pos'>" + 
        "搜尋 : <input type = 'text' id = 'search'/></span></td></tr>" +
        "<tr><td>編號</td><td>真實名稱</td><td>對應快捷</td></tr>";
        putKey();
        return; // 沒有輸入條件
    }
    else {
        var search_value = getId('search').value;
        tab.innerHTML = 
        "<tr><td class = 'col_title' colspan = '3'><b>目前快捷</b>" + 
        "<span class = 'position-absolute top-0 end-0' id = 'search_pos'>" + 
        "搜尋 : <input type = 'text' id = 'search'/></span></td></tr>" +
        "<tr><td>編號</td><td>真實名稱</td><td>對應快捷</td></tr>";
    }
    var is_put = []; // 已經放進去的
    // 條件一 : 真實名稱
    for (i in all_real) {
        // 有符合的字串
        if (all_real[i].includes(search_value)) { 
            is_put.push(i);
            putEachKey(i);
        }
    }
    // 條件二 : 對應快捷
    for (i in all_rela) {
        // 還沒放過且有符合的字串
        if (!(is_put.includes(i)) && all_rela[i].includes(search_value)) { 
            is_put.push(i);
            putEachKey(i);
        }
    }
    getId('search').addEventListener('change', checkSearch);
    getId('search').value = search_value;
}

function putEachKey(i) { // 把目前的快捷對應放進 table
    tab.innerHTML +=  
    "<tr/><td/>"+ all_no[i]  + 
        "<td>" + all_real[i] + "</td>" +
        "<td>" + all_rela[i] + "</td></tr>";
};