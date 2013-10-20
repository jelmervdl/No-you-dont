function key(namespace, name)
{
	return namespace + ":" + name;
}

function get_hostname(url)
{
	var m;
	if (!(m = url.match(/^([^:]+):\/\/([^\/]+)\/?/)))
		return null;
	
	return m[2];
}

function get_domain(hostname)
{
	var m;
	
	if (!(m = hostname.match(/\.([^\.]+\.[^\.]+)$/)))
		return hostname;
	
	return m[1];
}

function is_a_bad_url(hostname)
{
	return typeof localStorage[key("site", hostname)] != "undefined";
}

function count_hit(hostname)
{
	localStorage[key("site", hostname)]++;
}

function take_action(tab_id, hostname)
{
	count_hit(hostname);
	
	switch (localStorage[key("option", "behavior")])
	{
		case "close_tab":
			chrome.tabs.remove(tab_id);
			break;

		case "show_page":
		default:
			chrome.tabs.update(tab_id, {url: chrome.extension.getURL("blocked.html")});
			break;
	}

	return {cancel: true};
}

function update_plugin()
{
	var k = key("option", "installed_version");
	var version = parseInt(localStorage[k] || 0, 10);
	
	// version lower than 1? Probably first install
	if (version < 1)
	{
		// set default action
		localStorage[key("option", "behavior")] = "show_page";
		
		// give the user some default sites to block
		localStorage[key("site", "reddit.com")] = 0;
		localStorage[key("site", "imgur.com")] = 0;
		localStorage[key("site", "news.ycombinator.com")] = 0;
		version = 1;
	}
	
	localStorage[k] = version;
}

function main()
{
	var callback = function (details) {
		if (!details.url)
			return;
	
		var hostname = get_hostname(details.url);
		if (is_a_bad_url(hostname) || is_a_bad_url(get_domain(hostname)))
			return take_action(details.tabId, hostname);
	};

	var filter = {
		urls: ['http://*/*', 'https://*/*'],
		types: ['main_frame']
	};

	var specs = ['blocking'];

	chrome.webRequest.onBeforeRequest.addListener(callback, filter, specs);
}

update_plugin();

main();
