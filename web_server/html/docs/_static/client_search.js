$(document).ready(function(){
    var query = document.location.search;
    var params = new URLSearchParams(query);
    var q = params.get("q");

    if(q) {
        window.history.pushState({}, "", window.location.href.replace(/\?.*/,''));
        $('#rtd-search-form').find('input[type=text]').val(q);
        dosearch(q);
    }

    function dosearch(q)
    {
        $("#searchres").remove();
        $("div[itemprop=articleBody]").after('<div id="searchres">');
        $("div[itemprop=articleBody],.rst-footer-buttons").hide();
        var sdiv = $('#searchres');
        sdiv.html('<div style="cursor: pointer; float:right; border: 1px solid #334155; border-radius:4px; position: relative; padding: 2px 8px; color:#22c55e; font-size:0.9rem;" id="sclose">Close Search Results</div>');
        $.getJSON(
            "/apps/docs/rsearch/results.json",
            {q:q},
            function(res)
            {
                var r = res.rows;
                sdiv.append("<h3>Search Results:</h3><p><p>");
                for (var i=0;i<r.length;i++)
                {
                    sdiv.append(
                        '<div data-base="'+ r[i].plink.replace(/#.*/,'')  +'" class="searchsect">'+
                          r[i].html+
                          '<div class="expand expandTop">show less</div>' +
                          '<div class="fader">' +
                            '<div class="cont" style="bottom:3px; left:15px; position: relative;">...</div>' +
                            '<hr style="margin: 2px 0; border-color: #334155;">'+
                            '<div class="expand expandBottom">show more</div>' +
                          '</div>' +
                         '</div>');
                }
                $('.expandTop').hide();
                if(r.length==0)
                {
                    sdiv.append('<p>No Results for "'+q+'"</p>');
                }
                else
                {
                    var hlinks = sdiv.find("a.headerlink");
                    var i=0;
                    for (;i<hlinks.length;i++) {
                        var hx = hlinks.eq(i).parent();
                        hlinks.eq(i).remove();
                        var txt = hx.text();
                        hx.empty().append('<span>');
                        var hspan = hx.find('span');
                        hspan.unwrap();
                        hspan.html('<a class="linked mlink" href="/docs/' + r[i].plink +'">' + txt + '</a>'+
                                    '<br><span><a class="linked slink" href="/docs/' +
                                 r[i].plink+ '">' + r[i].plink.replace(/.html#.*/,'') + ' : ' +
                                 r[i].full+ '</a>');

                    }
                    $(".searchsect").each(function(){
                        var t=$(this);
                        if(t.height() < 233)
                        {
                            t.find(".fader").replaceWith('<hr style="margin: 2px 0; border-color: #334155;">');
                        }
                    });
                }

                $('.linked').click(function(e){
                    $('#searchres').remove();
                    $("div[itemprop=articleBody],.rst-footer-buttons").show();
                });

                $('.expand').click(function(e){
                    var sect = $(this).closest(".searchsect");
                    t = sect.find('.expand');

                    if (sect.hasClass('expanded'))
                    {
                        t.html("show more");
                        sect.find('.expandTop').hide();
                        sect.css('max-height','250px');
                        var o = sect.offset();
                        if($(window).scrollTop() > o.top-40)
                            $(window).scrollTop(o.top-40);
                        sect.find('.cont').show();
                    }
                    else
                    {
                        t.text("show less");
                        sect.css("max-height","initial");
                        sect.find('.expandTop').show();
                        sect.find('.cont').hide();
                    }
                    sect.toggleClass('expanded');
                });
            }
        );

        $('#sclose').click(function(e) {
            sdiv.remove();
            $("div[itemprop=articleBody],.rst-footer-buttons").show();
        });
    }

    $('#rtd-search-form').submit(function(e){
        e.preventDefault();
        var q = $(this).find('input[name=q]').val();
        dosearch(q);
        return false;
    });

    $('#rtd-search-form input[name=q]').autocomplete(
        {
            serviceUrl: '/apps/docs/rsearch/suggest.json',
            onSelect: function(sel)
            {
                if (sel.data == "search")
                {
                    dosearch(sel.value);
                }
                else if(sel.data)
                {
                    $('#searchres').remove();
                    $("div[itemprop=articleBody],.rst-footer-buttons").show();
                    window.location.href = "/docs/" + sel.data;
                }
            }
        }
    );

    // Theme toggle
    function toggleTheme() {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            document.cookie = 'theme=light; path=/; max-age=31536000; SameSite=Lax';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.cookie = 'theme=dark; path=/; max-age=31536000; SameSite=Lax';
        }
    }
    $('#rp-theme-toggle').on('click', toggleTheme);

    // Close sidebar overlay
    $('#rp-close-sidebar').on('click', function() {
        $('[data-toggle="wy-nav-shift"]').removeClass('shift');
        $('[data-toggle="rst-versions"]').removeClass('shift');
    });

});
