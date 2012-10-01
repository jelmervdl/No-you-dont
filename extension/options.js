var $ = function(expression) {
	return document.querySelector(expression);
}

var $$ = function(expression) {
	return document.querySelectorAll(expression);
}

function key(namespace, name)
{
	return namespace + ":" + name;
}

function namespace(key)
{
	return key.split(":", 2)[0];
}

function name(key)
{
	return key.split(":", 2)[1];
}

NodeList.prototype.map = function(callback)
{
	for (var i = 0; i < this.length; ++i)
		callback(this[i]);
}

function Website(url, hits)
{
	this.url = url;
	
	this.el = document.createElement("div");
	this.el.role = "listitem";
	this.el.className = "blocked-website";
	
	var row = document.createElement("div");
	this.el.appendChild(row);
	
	var favicon_el = document.createElement("img");
	favicon_el.className = "favicon";
	favicon_el.src = "chrome://favicon/http://" + this.url;
	row.appendChild(favicon_el);
	
	this.url_el = document.createElement("span");
	this.url_el.className = "hostname";
	this.url_el.innerText = this.url;
	row.appendChild(this.url_el);
	
	this.hits_el = document.createElement("strong");
	this.hits_el.className = "blocked-hits";
	this.hits_el.title = "Number of times blocked";
	row.appendChild(this.hits_el);
	
	this.delete_btn = document.createElement("button");
	this.delete_btn.className = "delete_btn";
	this.delete_btn.title = "Remove from list";
	this.el.appendChild(this.delete_btn);
	
	this.delete_btn.addEventListener("click", function(e) {
		remove_website_from_list(url);
	}, false);
	
	this.update(hits);
}

Website.prototype.update = function(hits)
{
	this.hits = hits;
	this.hits_el.innerText = this.hits;
}

var $sites = {};

function add_website_to_list(url, hits)
{
	var site = new Website(url, hits);
	$sites[site.url] = site;
	$("#blocked-websites-list").appendChild(site.el);
}

function remove_website_from_list(hostname)
{
	delete localStorage[key("site", hostname)];
	
	var site = $sites[hostname];
	site.el.parentNode.removeChild(site.el);
	delete $sites[hostname];
}

function add_website(hostname, hits)
{
	hostname = hostname.trim();
	
	if (hostname.length == 0)
		return false;
	
	if (localStorage[key("site", hostname)])
		return true;
	
	localStorage[key("site", hostname)] = hits || 0;
	add_website_to_list(hostname, 0);
	return true;
}

function remove_website(hostname)
{
	delete localStorage[key("site", hostname)];
	
	if ($sites[hostname])
		remove_website_from_list(hostname);
}

function update_websites_list()
{
	for (var key in localStorage)
	{
		if (namespace(key) != 'site')
			continue;
		
		var hostname = name(key);
		add_website_to_list(hostname, localStorage[key]);
	}
}

function update_behavior(value)
{
	$$("#behavior input[type=radio]").map(function(el) {
		el.checked = el.value == value;
	});
}

$$("#behavior input[type=radio]").map(function(el) {
	this.addEventListener("change", function(e) {
		if (e.target.checked)
			localStorage[key("option", "behavior")] = e.target.value;
	});
});

$("#new-website-entry input").addEventListener("keyup", function(e) {
	if (e.keyCode == 13)
		if (add_website(e.target.value))
			e.target.value = "";
}, false);

window.addEventListener("storage", function(e) {
	switch (namespace(e.key))
	{
		case "site":
			if (typeof $sites[name(e.key)] == "undefined")
				add_website_to_list(name(e.key), e.newValue);
			else if (e.newValue === null)
				remove_website_from_list(name(e.key));
			else
				$sites[name(e.key)].update(e.newValue);
			break;
		
		case "option":
			if (name(e.key) == "behavior")
				update_behavior(e.newValue);
			break;
	}
}, false);

update_websites_list();

update_behavior(localStorage[key("option", "behavior")] || "show_page");
