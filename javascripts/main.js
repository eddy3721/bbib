//google表單連結
var googleSheet = {
    "sheetUrl": "https://docs.google.com/spreadsheets/d/199I_ydHcA5SbUMPVNbxIorvh-edSQOZzM7hc2KWmH3Q/edit#gid=0",
    "appScript": "https://script.google.com/macros/s/AKfycbyStPWlmWgfO5VDIqcnmeEwZkWenCOxyW3GQCUe80xf6ZRGIaef2S9QqemzaG08MWZI1w/exec"
};

//菜單陣列
var menuList = [
    ['./index.html', '首頁', null],
    ['./bbList.html', '怪物一覽', null],
    ['./about.html', '關於', null]
];

//已選擇篩選器紀錄
var filters = [];

//右上通知
var Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

//BBList.html
async function BBListReady() {
    await loadMenu();
    await ready();
    await loadBBData();
    await loadFilter();
}

//index.html
async function homeReady() {
    await loadMenu();
    await ready();
    $('#BBTotal').text(localStorageGetItem('BBData').data.length);
}

//給怪物添加標籤
function BBAddLabel(BB) {
    let label = '';
    label += ` rare-${BB.rare}`;

    return label;
}

//載入篩選器
async function loadFilter() {
    let $grid = $('#BBList').isotope({
        // options
        itemSelector: '.role',
        layoutMode: 'fitRows',
        getSortData: {
            role: '.role'
        },
    });

    //篩選
    $('.filter-button-group').on('click', 'button', function() {
        $(this).toggleClass("filter-checked");

        let filterValue = $(this).attr('data-filter');
        let filterIndex = filters.indexOf(filterValue);

        if (filterIndex === -1) {
            filters.push(filterValue);
        } else {
            filters.splice(filterIndex, 1);
        }
        console.log(filters);
        $grid.isotope({ filter: filters.join(',') });
    });

    //排序
    $('.sorter-button-group').on('click', 'button', function() {
        let checked = $(this).text() === '由新到舊(目前)';
        $(this).text(checked ? '由舊到新(目前)' : '由新到舊(目前)');

        if (checked) {
            $grid.isotope({ sortBy: 'role', sortAscending: false });
        } else {
            $grid.isotope({ sortBy: 'role', sortAscending: true });
        }
    });
}

//載入原作設定集
function loadCollections(name, n) {
    let content = '';
    if (n) {
        for (let i = 1; i <= n; i++) {
            content += `<img src="./images/collections/${name}_${i}.webp" alt="" class="collections-img" />`;
        }
    }

    return content;
}

//清空BBData
function removeBBData() {
    localStorage.setItem('BBData', null);
    Toast.fire({ icon: 'success', title: '請重新整理頁面!' });
}

//取localstorage解碼
function localStorageGetItem(key) {
    let data = localStorage.getItem(key);
    if (!data) {
        return 0;
    } else {
        return JSON.parse(LZString.decompress(data));
    }
}

//怪物詳情
function showBBDetail(block) {
    let BBName = $(block.children[1]).text();
    let BBData = localStorageGetItem('BBData').data;
    if (!BBData) return;
    let BBDetail = BBData.find(e => e.name === BBName);
    if (!BBDetail) {
        Toast.fire({ icon: 'error', title: '怪物不存在!' });
        return;
    };

    let rare = stringMul(BBDetail.rare, '★');

    Swal.fire({
        title: BBDetail.name,
        showClass: {
            popup: 'animate__animated animate__flipInY'
        },
        html: `
                <p>${rare}</p>
                <div class="BB-detail">
                    <div class="BB-detail-img">
                        <img src="./images/${BBDetail.name}.png" onerror="this.src='./images/unknown.png'" alt="" />
                    </div>
                    <div class="BB-detail-content">
                        <div><label>原作者:&nbsp;</label>${BBDetail.originalAuthor}</div>
                        <div><label>免費使用:&nbsp;</label>${(BBDetail.freeToUse === 'true') ? '是':'否'}</div>
                        <div><div class="mb-1">怪物介紹:</div>&emsp;${BBDetail.introduce}</div>
                    </div>
                </div>
                <div class="concept-art BB-detail-content">
                    <div>
                        <div class="mb-2">原作設定集:</div>
                        ${loadCollections(BBDetail.name, BBDetail.collectionsQuantity)}
                    </div>
                </div>
                `,
        showCloseButton: true,
        showCancelButton: false,
        focusConfirm: false,
        confirmButtonText: '<i class="fa fa-thumbs-up"></i>'
    });
};

//載入怪物一覽
async function loadBBData() {
    let BBData = localStorageGetItem('BBData').data;
    if (!BBData) return;

    let content = '';
    content += `<div class="row">`;

    BBData.forEach(e => {
        content += `
            <div class="role${BBAddLabel(e)}" onClick="showBBDetail(this);">
                <div>
                    <img src="./images/${e.name}_avatar.png" onerror="this.src='./images/unknown_avatar.png'" alt="">
                </div>
                <p>${e.name}</p>
            </div>`;
    });

    content += `</div>`;

    $('#BBList').html(content);
}

//載入菜單
async function loadMenu() {
    let content = await loadMenuSublist(menuList, 0, '');
    //手動刷新按鈕
    let refreshBtn = `
            <div class="ml-3 refreshBBDataBlock">
                <button class="btn btn-success btn-sm" onClick="removeBBData();">手動刷新</button>
                <div class="text-muted">上次刷新:</div>
                <div class="text-muted" id="last-refresh-time"></div>
            </div>
        `;
    //console.log(content);
    $('#menu').append(content);
    $('#menu').append(refreshBtn);
}

async function loadMenuSublist(arr, level, nodeId) {
    let content = '';
    if (nodeId) {
        content += `<ul class="list-unstyled collapse show" id="${nodeId}">`;
    } else {
        content += `<ul class="list-unstyled">`;
    }


    for (let i = 0; i < arr.length; i++) {
        let e = arr[i];
        let padding = stringMul(level, '&emsp;');
        content += `<li>`;

        if (e[2]) {
            content += `<a href="#${e[0]}" data-toggle="collapse">${padding+e[1]}</a>`;
            content += await loadMenuSublist(e[2], level + 1, e[0]);
        } else {
            content += `<a href="${e[0]}">${padding+e[1]}</a>`;
        }

        content += `</li>`;
    }

    content += `</ul>`;

    return content;
}

//字串複製
function stringMul(n, str) {
    let result = '';
    while (n--) result += str;
    return result;
}

//準備
async function ready() {

    //取googleSheet
    let BBData = localStorageGetItem('BBData');
    let nowTime = new Date();
    if (BBData) {
        let lastRefreshTime = new Date(BBData.refreshTime * 1000);
        $('#last-refresh-time').text(lastRefreshTime.toLocaleDateString() + lastRefreshTime.toLocaleTimeString());
        if (Math.floor((+nowTime) / 1000) - BBData.refreshTime <= 43200) return;
    }

    let a = {
        sheetUrl: googleSheet.sheetUrl,
        sheetTag: '怪物一覽',
    };
    await $.get(googleSheet.appScript, a, function(data) {
        let d = data.split(','); //把傳出來的字串分割成陣列
        let arr = [];
        for (let i = 0; i < d.length;) {
            arr.push({
                'name': d[i++],
                'rare': d[i++],
                'originalAuthor': d[i++],
                'freeToUse': d[i++],
                'introduce': d[i++],
                'collectionsQuantity': d[i++]
            });
        }

        arr = arr.reverse(); //由新到舊

        let obj = {
            refreshTime: Math.floor((+nowTime) / 1000), //上次刷新時間
            data: arr
        };

        $('#last-refresh-time').text(nowTime.toLocaleDateString() + nowTime.toLocaleTimeString());
        //console.log(arr);
        //console.log(JSON.stringify(obj).length);
        //console.log(LZString.compress(JSON.stringify(obj)).length);
        localStorage.setItem('BBData', LZString.compress(JSON.stringify(obj)));
    });
}