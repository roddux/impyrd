var boards = {};
var gBoard = 1;
var DEBUG = true;

function dbg(str) {
    if (DEBUG)
        console.log(str);
}

function clearPosts() {
    dbg("clearPosts() called");
    var x = document.getElementById("postlist");
    while (x.firstChild)
        x.removeChild(x.firstChild);
}

function setBoard(id) {
    dbg("setBoard() called");
    gBoard = id;
    setPageState("board", id);
    document.getElementById("boardname").innerHTML = boards[id];
}

function changeBoardCallback() {
    dbg("changeBoardCallback() called");
    setBoard(this.dataset["boardId"]);
    clearPosts();
    loadPosts();
    return false;
}

function changePostCallback() {
    dbg("changePostCallback() called");
    clearPosts();
    setPageState("post", this.dataset["postId"]);
    loadPosts(this.dataset["postId"]);
}

function loadBoardList() {
    dbg("loadBoardList() called");
    var bl = new XMLHttpRequest();
    bl.open("GET", "/main.py?show=boardlist", true);
    bl.onreadystatechange = function(rs) {
        if (this.readyState === 4) {
            if (this.status === 200) {
                renderBoardList(rs.target.responseText);
            } else {
                ajaxError(rs.target.statusText);
            }
        }
    };
    bl.send();
}

function renderBoardList(data) {
    dbg("renderBoardList() called");
    var boardJSON = JSON.parse(data);
    var boardList = document.getElementById("boardlist");
    for (var i in boardJSON) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.innerHTML = boardJSON[i].name;
        a.setAttribute("href", "");
        a.dataset["boardId"] = boardJSON[i].id;
        a.onclick = changeBoardCallback;
        li.appendChild(a);
        boardList.appendChild(li);
        boards[boardJSON[i].id] = boardJSON[i].name;
    }
    boardList.dispatchEvent(new Event("boardListLoaded"));
}

function loadPosts(post) {
    var pl = new XMLHttpRequest();
    if (post !== undefined) {
        dbg("loadPosts() called for child posts");
        pl.open("GET", "/main.py?show=posts&board="+gBoard+"&post="+post, true);
    } else {
        dbg("loadPosts() called for board posts");
        pl.open("GET", "/main.py?show=posts&board=" + gBoard, true);
    }
    pl.onreadystatechange = function(rs) {
        if (this.readyState === 4) {
            if (this.status === 200) {
                renderPosts(rs.target.responseText);
            } else {
                ajaxError(rs.target.statusText);
            }
        }
    };
    pl.send();
}

function renderPosts(data) {
    dbg("renderPosts() called");
    var posts = JSON.parse(data);
    var postList = document.getElementById("postlist");
    for (var i in posts) {
        var li = document.createElement("li");
        var hr = document.createElement("hr");

        var div = document.createElement("div");
        div.setAttribute("id", "post_" + i + "_div");

        var date = document.createElement("span");
        date.setAttribute("id", "post_" + i + "_date");
        date.setAttribute("class", "date");
        date.innerHTML = posts[i].date;

        var title = document.createElement("span");
        title.setAttribute("id", "post_" + i + "_title");
        title.setAttribute("class", "title");
        title.innerHTML = posts[i].title;
        title.dataset["postId"] = posts[i].id;
        title.onclick = changePostCallback;

        var body = document.createElement("span");
        body.setAttribute("id", "post_" + i + "_body");
        body.setAttribute("class", "body");
        body.innerHTML = posts[i].body;

        div.appendChild(date);
        div.appendChild(title);
        div.appendChild(hr);
        div.appendChild(body);
        li.appendChild(div);
        postList.appendChild(li);
    }
}

function init() {
    dbg("init() called");

    // What if we load straight from URL? :(
    // Add in board-id i suppose
    document.getElementById("boardlist").addEventListener("boardListLoaded",
            function() {
                setBoard(gBoard);
            }
    );

    loadBoardList();
    refresh();
}

function refresh() {
    dbg("refresh() called");
    var state = getPageState();
    clearPosts();
    if (state.show === "board") {
        gBoard = state.id;
        loadPosts();
    } else if (state.show === "post") {
        loadPosts(state.id);
    }
    setBoard(gBoard);
}

function ajaxError(data) {
    dbg("Error in AJAX call: " + data);
}

function getPageState() {
    dbg("getPageState() called");
    var state = window.location.hash;
    if (state.contains("?")) {
        state = state.split("/");
        return {"show": state[1], "id": state[2],
            "url": "#?/" + state[1] + "/" + state[2]};
    } else {
        return {"show": "board", "id": 1, "url": "#?/board/1"};
    }
}

function setPageState(show, id) {
    dbg("setPageState() called with '" + show + "' and '" + id + "'");
    var x = {"show": show, "id": id, "url": "#?/" + show + "/" + id};
    if (history.state) {
        if (history.state.url !== x.url) {
            dbg("pushing state {'show':'" + show + ", 'id':'" + id + "'}");
            history.pushState(x, "State", x.url);
        }
    } else {
        dbg("pushing state {'show':'" + show + ", 'id':'" + id + "'}");
        history.pushState(x, "State", x.url);
    }
}

init();

window.onpopstate = function(e) {
    if (e.state !== null) {
        dbg("event handler for 'popstate' called");
        history.replaceState(e.state, "State", e.state.url);
        refresh();
    }
};
