var search = document.getElementById("search");
var results = document.getElementById("results");
var curSearch = 0;
var selectedIndex = -1;
var storedQuery = chrome.storage.local.get('query', function(storedQuery) {
	if (storedQuery.query) {
		search.value = storedQuery.query;
		search.select();
		chrome.tabs.query({}, function(tabs) { display(curSearch, tabs, storedQuery.query) });
	}	
});

search.addEventListener('keyup', function(evt) {
	if (evt.which == 38 || evt.which == 40 || evt.which == 13) return;
	var query = search.value;
	if (query.length < 2) return;
	var id = ++curSearch;
	results.style.height = results.clientHeight + "px";
	chrome.tabs.query({}, function(tabs) { display(id, tabs, query) });
	chrome.storage.local.set({'query': query}, function() {});
});

document.body.addEventListener('keyup', function(evt) {
	var lis = document.getElementsByTagName("li");
	if (evt.which == 38) { //UP
		moveSelector(-1, lis);
	}
	if (evt.which == 40) { //DOWN
		moveSelector(1, lis);
	}
	if (evt.which == 13) { //ENTER
		if (selectedIndex == -1) return;
		openTab(lis[selectedIndex]);
	}
});

function moveSelector(direction, lis) {
	var newIndex = selectedIndex + direction;
	if (newIndex < 0 || newIndex >= lis.length) return;
	lis[selectedIndex].className = "";
	selectedIndex = newIndex;
	lis[selectedIndex].className = "selected";
}

function openTab(li) {
	chrome.tabs.update(li.tabId, {selected: true});
	chrome.windows.update(li.windowId, {focused: true});
}
function closeTab(li) {
	chrome.tabs.remove(li.tabId);
	li.parentNode.removeChild(li);
	selectedIndex = -1;
}


function display(id, tabs, query) {
	if (id != curSearch) return;
	results.innerHTML = "";
	var first = true;
	for (var t in tabs) {
		var tab = tabs[t];
		var re = new RegExp(".*" + query + ".*", "i");
		if (re.test(tab.title) || re.test(tab.url)) {
			var li = document.createElement("li");
			if (first) {
				first = false;
				li.className = "selected";
				selectedIndex = 0;
			}
			var close = document.createElement("span");
			close.className = "close";
			close.innerHTML = (tab.audible ? "&#x1F50A;" : "") + "&#10006;";
			close.addEventListener('click', function (evt) { closeTab(evt.target.parentNode); cancelBubble(evt); })
			li.appendChild(close);

			var title = document.createElement("div");
			title.innerText = tab.title;
			li.appendChild(title);
			li.setAttribute("title", tab.url);

			var favIconUrl = "";
			if (tab.favIconUrl) {
				favIconUrl = tab.favIconUrl.replace(/[^a-zA-Z0-9.\/:]/g, function(c) { return "%" + c.charCodeAt(0).toString(16) });
			}
			li.style.backgroundImage = "url(" + favIconUrl + ")";
			results.appendChild(li);
			li.tabId = tab.id;
			li.windowId = tab.windowId;
			title.addEventListener('click', function(evt) { openTab(evt.target.parentNode) });
		}
	}
	results.style.height = "auto";
}

function cancelBubble(e) {
	var evt = e ? e:window.event;
	if (evt.stopPropagation)    evt.stopPropagation();
	if (evt.cancelBubble!=null) evt.cancelBubble = true;
}

