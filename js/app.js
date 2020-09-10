const app = {
	category:undefined,
	group: undefined,
	section: undefined,
	state: function (category, group, section) {
		app.category = category;
		app.group = group;
		app.section = section;
	},
	init: function () {	
		Nav.load(app.testPage("Design", "Logos", "Type"))
		window.addEventListener('hashchange', app.poppin);
		history.replaceState({}, null, '#Moodboard');
		window.addEventListener("resize", Grid.resizeAllGridItems);
		
	},
	testPage: function (id, group, gallery) {
		setTimeout(() => {
			var target = $(`.sec-a:contains('${gallery}')`);
			var parent = $(target).closest(".category");
			
			$(parent).find(".title").addClass("active")
			$(target).addClass("active")			
			$(parent).addClass("loaded");
			Grid.load(id, group, gallery); // cancel for  test / debug
		}, 100);
	},
	toggle: function (state, ref) {
		switch (state) {
			case "close-modal":
				Modal.close()
				break
			case "open-modal":
				Modal.open(ref);
				break
			case "change-section":
				// removes active class of all the titles, and adds an active class to the link
				Help.changeState($(".title, .sec-a"), $(ref))
				var title = $(ref).closest("ul").siblings();
				
				//console.log(title);
				$(title).addClass("active")
				$("#search").val("");
				
				if (Modal.state == "open") {
					Modal.close()
				} else {
					$(".gallery-header").animate({ top: "-" + Tabs.height, opacity: 0}, 300)	
				}
				
				// fade out gallery
				$("#gallery-container .images").animate({ opacity: 0 }, 500)
				setTimeout(() => {
					Grid.load(app.category, app.group, app.section)
					$(".gallery-tabs, #gallery-container .images").empty();
				}, 500);

				setTimeout(() => {					
					$(".gallery-header").animate({ top: 0, opacity: 1 }, 400)
					$(".gallery-tabs, #gallery-container .images").animate({ opacity: 1 }, 1000)

				}, 900);
			


				$(".category").removeClass("loaded") // closes all dropdowns
				
				break
			case "change-tabs":
				var target = $(`.sec-a:contains('${$(ref).text()}')`);
				
				Help.changeState($(".gallery-tabs > .tab, .sec-a"), $(ref))
				$(target).addClass("active")	
				$("#gallery-container .images").animate({ opacity: 0 }, 500)
				setTimeout(() => {
					$("#gallery-container .images").empty()
					Grid.load(app.category, app.group, $(ref).text())
				}, 300);

				setTimeout(() => {
					$("#gallery-container .images").animate({ opacity: 1 }, 1000)
				}, 700);
				break
			default: 
				console.log("no change")
		}
	}
}

var Nav = {
	width: "120px",
	load: function (_callback) {
		$.getJSON("js/images.json", function(data){
			data.forEach(function(index){
				var header = document.createElement("h3");
				var div = document.createElement("div");
			
				index.content.forEach(function (group) {
					var category = document.createElement("div")
					var ul = document.createElement("ul");
					var h = document.createElement("div");
					var a = document.createElement("a");

					group.subsections.forEach(function (section) {
						var li = document.createElement("li");
						$(li).text(section["section"]).addClass("sec-a").appendTo(ul);
						$(li).bind("click", function (e) { Nav.change(this) })
					})
					//folder icons and side links
					$(a).addClass("side-a").text(group["group"]).appendTo(category);
					$(a).bind("click", function (e) { Nav.change(this) })
					$(h).addClass("title").append(a).appendTo(category);
					$(category).addClass("category").append(ul).appendTo(div)
					
					// when you over over a nav title, it gets an active class, and loads the dropdown
					$(category).on("mouseover mouseout", function () {
						//$(this).find(".title").toggleClass("active");
						$(this).find(".title").toggleClass("hovered");
						$(this).toggleClass("loaded");
					})
				})
				$(header).text(index["id"]).addClass("category-title");
				$(div.prepend(header))
				$(div).attr("data-target", index["id"]).addClass("album-container").appendTo($("#list"));
			})			
		})
	},
	change: function (target) {
		var category = $(target).parents().closest(".album-container").attr("data-target");
		var group = $(target).parent().siblings().closest(".title").find('.side-a');
		var section = $(target).closest(".sec-a");
	
		if($(target).hasClass("active")) {
			return false;
		} else if ($(target).hasClass("side-a")) {
			app.state(category, $(target).html(), undefined)
			app.toggle("change-section", target);
		}else {
			app.state(category, $(group).text(), $(section).html())
			app.toggle("change-section", target);
			
		}
		
	}
}

var Tabs = {
	height: "24px",
	load: function(group, sectionName){
		if($(".tab").length > 0) {
			return false;
		} else {
			group.subsections.forEach(function(subS){
				var tab = document.createElement("div");
				$(tab).text(subS["section"]).addClass("tab").appendTo($(".gallery-tabs"))
				$(tab).on("click", function () {Tabs.change(this);})
			})
			if(sectionName) {
				$(".tab").each(function(index){
					if( $(this).text() == sectionName) {
						$(this).addClass("active");
						return false;
					} 
				})
			} else {
				$(".tab:first-child").addClass("active");
			}
		}
	},
	change: function (ref) {
		if($(ref).hasClass("active")) {
			return false;
		} else {
			app.toggle("change-tabs", ref)
		}
	}
}

var Grid = {
	load: function(id, group, section) {
		$.getJSON("js/images.json", function(data){
			var targetId = data.find(x => x.id === id)
			var targetSection = targetId.content.find(x => x.group === group);

			if(section == undefined) { // side nav
				targetSection.subsections[0].gallery.forEach(function (i) { Grid.render(i); })
				app.state(id, group, section)
				Tabs.load(targetSection, section)
			} else { // normal load
				var targetGallery = targetSection.subsections.find(x => x.section === section);
				targetGallery.gallery.forEach(function (i) { Grid.render(i); })
				app.state(id, group, section)
				Tabs.load(targetSection, section)
			}	
		})
	},
	render: function (obj) {
			var grid = document.createElement("div");
			var gridEl = document.createElement("div");
			switch (obj.type) {
				case "image":
					$("<img/>", { class: "grid-img", src: `img/${obj.src}` }).appendTo(gridEl)
					$("<p/>", { class: "caption", text:`File: ${obj.src}`}).appendTo(gridEl)
					break
				case "video":
					$('<video/>', { src: `img/${obj.src}`, type: 'video/mp4', poster: `/assets/stills/${obj.poster}` }).appendTo(gridEl)
					$("<p/>", { class: "caption", text:`File: ${obj.src}`}).appendTo(gridEl)
					$("<div/>", { class: "play" }).bind("click", function(e){Grid.playHandler(this)}).appendTo(gridEl)
			
					break
				case "gallery":
					obj.gallery.forEach(function (ind) {
						var slide = document.createElement("div");
						if (ind.type == "image") {
							$("<img/>", { src: `img/${ind.src}` }).appendTo(slide)
							$("<p/>", { class: "caption", text: `File: ${ind.src}` }).appendTo(slide)
							$(slide).addClass("gallery-img").appendTo(gridEl)
						} else {
							
							$('<video/>', { src: `img/${ind.src}`, type: 'video/mp4', poster: `/assets/stills/${ind.poster}` }).appendTo(slide)
							$("<div/>", { class: "play" }).bind("click", function(e){Grid.playHandler(this)}).appendTo(slide)
							$("<p/>", { class: "caption", text: `File: ${ind.src}` }).appendTo(slide)
							$(slide).addClass("gallery-img").appendTo(gridEl)
						}
						$("<div/>", { class: "gal-icon" }).appendTo(gridEl)
					})
					break
			}
	
		$(".grid-content > .gallery-img:first-child").addClass("active");
		$(gridEl).addClass("grid-content").appendTo(grid).bind("dblclick", function () {Grid.clickHandler(this);})
		$(grid).addClass("grid").appendTo("#gallery-container .images")
		$(".images").addClass("active")
		setTimeout(() => {Grid.resizeAllGridItems()}, 700);
	}, 

	clickHandler: function (ref) {
		$(function () {
			if (!$(ref).children(":first").hasClass("gallery-img")) {
				var div = document.createElement("div");
				var type = $(ref).children(":first").get(0).nodeName;
				var source = $(ref).children(":first").attr("src")
				var thumb = $(ref).children(":first").attr("poster");
				if (type == "IMG") {
					$("<img/>", { src: source }).appendTo(div)
					$("<p/>", { id: "file", text: source }).appendTo(div)
					$(div).addClass("modal-img active").appendTo(".modal-viewer")
				} else {
					$('<video/>', { src: source, controls: true,type: 'video/mp4', poster: thumb }).appendTo(div)
					$("<p/>", { id: "file", text: source }).appendTo(div)
					$(div).addClass("modal-img active").appendTo(".modal-viewer")
				}
				app.toggle("open-modal")
			} else {
				var arr = $(ref).children(".gallery-img").get();
				var inc = 0;
				arr.forEach(function (i) {
					var div = document.createElement("div");
					var type = $(i).children(":first").get(0).nodeName;
					var source = $(i).children(":first").attr("src");
					var thumb = $(i).children(":first").attr("poster");
					var length = $(ref).children(".gallery-img").length
					
					if (type == "IMG") {
						$("<img/>", { src: source }).appendTo(div)
						$("<p/>", { id: "file", text: source }).appendTo(div)
						$(div).addClass("modal-img").attr("data-index", inc).appendTo(".modal-viewer")
					} else {
						$('<video/>', { src: source, controls: true, type: 'video/mp4',poster: thumb }).appendTo(div)
						$("<p/>", { id: "file", text: source }).appendTo(div)
						$(div).addClass("modal-img").attr("data-index", inc).appendTo(".modal-viewer")
					}	
					inc++;
				})
				app.toggle("open-modal", ref)
			}
		});
	},
	playHandler: function (ref) {
		$(document).ready(function () {
			var btnParent = $(ref).parents().closest(".grid-content")
			Grid.clickHandler(btnParent)
		})
	},
	resizeGridItem: function(item){
		grid = document.getElementsByClassName("images")[0];
		rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
		rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));
		rowSpan = Math.floor((item.querySelector('.grid-content').getBoundingClientRect().height+rowGap)/(rowHeight+rowGap));
		item.style.gridRowEnd = "span "+rowSpan;
	},
	resizeAllGridItems:function(){
		var grids = document.getElementsByClassName("images");
		var allItems = document.getElementsByClassName("grid");
			for(x=0;x<allItems.length;x++){
				Grid.resizeGridItem(allItems[x]);
			}
	},
	resizeInstance:function(instance){
		item = instance.elements[0];
		Grid.resizeGridItem(item);
	},
	out: function () {
		$("#gallery-container .images").delay(25).animate({opacity: 0},200)
	}
}

var Search = {
	data: function (val) {
		$("#gallery-container .images").empty();
		$.getJSON("js/images.json", function (data) {
			for (var i = 1; i < data.length; i++) { //nsfw toggle
				data[i].content.forEach(function (sec) {
					sec.subsections.forEach(function (target) {
						target.gallery.forEach(function (img) {
							var str = img["src"];
							const regex = RegExp(val);
							if (regex.test(str)) {
								Grid.render(img)
							}
						})
					})
				})
			}
		})
	},
	listeners: function () {
		$("#search").keyup(function () {
			var len = $("#search").val().length;
			var val = $("#search").val();
			if (len > 0 && len <= 2) { // creates results page
				var tab = document.createElement("div");
				$(".gallery-tabs, #gallery-container .images").empty();
				$(tab).addClass("tab").text("Search Results").addClass("active").appendTo(".gallery-tabs")
			} else if (len == 0) { // removes results page
				$(".gallery-tabs, #gallery-container .images").empty();
				Grid.load(app.category, app.group, app.section);
			} else if (len >= 3) { // search results
				Search.data(val)
			} else {
				return false;
			}
		})
	}
}

var Modal = {
	state: undefined,
	pos: 0,
	slides: 0,
	increment: function (inc) {
		var len = $(".modal-viewer > .modal-img").length;
		this.pos += inc;
		
		if (this.pos > len - 1) {
			this.pos = 0;
		} else if(this.pos < 0) {
			this.pos = len - 1;
		} 
		$(".modal-img").removeClass("active");
		$(`.modal-img[data-index='${this.pos}']`).addClass("active");
		$("#index").text((this.pos + 1) +  " / " + len)
	},
	open: function (ref) {
		var file = $("#file").text();
		var len = Modal.slides = $(ref).children(".gallery-img").length;

		$(".gallery-header").animate({ top: "-" + Tabs.height, }, 300)
		setTimeout(() => { Grid.out(); }, 300);
		
		if (len >= 1) {
			$("#index").text("1 / " + len);
			$("#back, #next, #index").addClass("show");
		}
		$(".modal-img:first, #modal-btns").addClass("active");
		
		$("#file-name").html(file.substring(4))
		$(".modal-img").on("dblclick", function (e) { app.toggle("close-modal"); })
		$("#modal-container, .modal").addClass("active");
		this.state = "open";
	},
	close: function () {
		$(".modal-img.active").animate({ top: "100%", opacity: "0" }, 300)

		setTimeout(() => {
			Modal.pos = Modal.slides = 0;
			Modal.state = "close";
			$(".modal-viewer, #file-name, #index").empty();
			$("#modal-container, .modal, #modal-btns").removeClass('active');
			$(".modal-viewer").trigger('zoom.destroy');
		}, 600);
		setTimeout(() => {
			$(".gallery-header").animate({ top: "0px" }, 300)
			$("#gallery-container .images").animate({ opacity: 1 }, 1000)
		}, 900);
	},
	events: function () {
		$(document).ready(function(){
			$(".modal-background").on("click", function (e) {
				var tar = e.target.className;
				tar == "modal-viewer" || tar == "modal-background" ? app.toggle("close-modal"): e.stopPropagation;
			})
			$("#close-modal-btn").on("click", function (e) {
				Modal.close();
			})
			$("#modal-zoom").click(function (e) {
				if($(this).hasClass("active")) {
					$(this).removeClass("active");
					$(".modal-viewer").trigger('zoom.destroy');
				} else {
					$(this).addClass("active");
					$(".modal-viewer").zoom();
				}
			})
			$(".modal-viewer").on("click", function (e) {
				$(".modal-viewer").trigger('zoom.destroy');
			})
			$("#next, #back").bind("click", function (e) {
				switch ($(this).attr("id")) {
					case "next":
						Modal.increment(1) 
						break;
					case "back":
						Modal.increment(-1);
						break
				}
			})	
		});
	}
}

Help = {
	changeState: function (prev, cur) {
			$(prev).removeClass("active");
			$(cur).addClass("active")
	}
}

document.addEventListener('DOMContentLoaded', function () {
	app.init();
	Search.listeners();
	Modal.events();

});

