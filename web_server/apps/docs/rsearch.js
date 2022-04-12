var Sql=require("rampart-sql");

var db=process.scriptPath + '/data/docs/db';

var sql;

/* This is a dual purpose script.  
   If run from command line, it will build the database and html pages.
   If run as a module, it will perform the typeahead and search functions.
*/

rampart.globalize(rampart.utils);

/**************** functions for ajax search ********************/

// connect to db as normal if module
if(module && module.exports)
{
    sql=new Sql.init(db);

    sql.set({
        keepNoise: true
    });
}

/* suggestions based on dictionary words from the corpus of all docs */
function corpsug(word)
{
    var res;
    sql.set({"indexaccess":true});//allow the search of metamorph word index like a table
    /* Return array of objects formatted as 
        [
            { 
                value: "matchedword1", 
                data: "search" 
            },
            { 
                value: "matchedword2", 
                data: "search" 
            },
            ...
        ]
    ordered by word count.  data: "search" -- indicate that a search should be performed upon clicking.
    See client javascript below in copy_files().
    */
    res=sql.exec(
        "select Word value, convert('search','varchar') data from sections_full_text_mmix where Word matches ? order by Count DESC",
        [word+'%']
    );
    return res.rows;
}

function suggest(req)
{
    var q = req.query.query;
    var cwords;
    if(!q) return {"suggestions":[]};
    var space = q.lastIndexOf(" ");
    if(space == -1)
    {
        // look for suggestions as an exact title match
        var res = sql.exec("select full value, plink data from sections where title matches ? order by length(title)",[q+'%'])
        // if less than 10, add word matches
        if (res.rowCount < 10)
        {
            cwords = corpsug(q);
            for (var i=0;i<cwords.length; i++)
                res.rows.push(cwords[i]);
        }
        return { 
            json: { "suggestions": res.rows}
        }
    }
    else 
    {
        // get suggestions for the partial word after the last space
        var pref = q.substring(0,space);
        var word = q.substring(space+1);
        if(!word.length)
            return {json: { "suggestions":  [q] } };
        cwords = corpsug(word);
        for( var i=0; i<cwords.length; i++)
        {
            var o=cwords[i];
            o.value = pref + " " + o.value;
        }
    }
    return {json: { "suggestions":  cwords} };
}

/* return entire sections' html that match query */
function results(req)
{
    return { json: 
        sql.exec(
            "select full, plink, html from sections where full\\text likep ?q",
            {q:req.query.q}
        )};
}

/**************** functions to build the docs search ***********/


/* load the html module */
var html=require("rampart-html");

// break up a page into <section>s
function parse_html_file(file, tofile){
    var res=readFile(file);
    var hres=html.newDocument(res,{"indent":true,wrap:120});
    var body = hres.findTag("body");
    var head = hres.findTag("head");
    /* check if we already altered this file */
    var acscript = body.findAttr("id=rampart-search");

    if(!acscript.length) {
        /* some alterations: jquery-autocomplete and the client-side search functions */
        body.append('<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.devbridge-autocomplete/1.4.11/jquery.autocomplete.min.js"></script>');
        body.append('<script id="rampart-search" src="_static/client_search.js"></script>');
        head.append(`
            <style>
            .wy-nav-top,.wy-side-nav-search { background-color:black;}
            body,h1,h2,h3,h4,h5,h6 {font-family: "Varela Round", Sans-Serif;}
            dl:not(.docutils) dt {font-family: "Varela Round", Sans-Serif !important; font-size: 90% !important;}
            .autocomplete-suggestions { border: 1px solid #999; background: #FFF; overflow: auto; width: auto !important; padding-right:5px;}
            .autocomplete-suggestion { padding: 2px 5px; white-space: nowrap; overflow: hidden; }
            .autocomplete-selected { background: #F0F0F0; }
            .autocomplete-suggestions strong { font-weight: normal; color: #3399FF; }
            .autocomplete-group { padding: 2px 5px; }
            .autocomplete-group strong { display: block; border-bottom: 1px solid #000; }
            .searchsect {max-height: 250px; overflow:hidden; padding-left:5px; border: 1px dotted gray; position: relative;}
            .expand {cursor:pointer;    background-color: #eee; padding: 3px;border: 1px gray dotted; font-family:monospace}
            .linked { font-size: 1.1em; display: inline-block; position: relative; margin-top: 20px;}
            .fader {position: absolute;bottom: 0px;height: 1em; left:-5px; right:0px; background-color: #fcfcfc;}
            .wy-nav-content {max-width: 1600px;}
            </style>`        
        );
        body.findClass('icon-home').attr('href','/');
        body.findClass('wy-breadcrumbs').prepend('<li><a href="/">Home</a> » ');
        printf("saving changes to %s\n",tofile);
        fprintf(tofile, "%s", hres.prettyPrint());
    }

    var sections=hres.findClass("section");
    
    var els=[];

    function getSect(level, el)
    {
        var hlev = `h${level}`;
        //add a temp div so we can manipulate the contents
        body.append("<div id='tempdiv'>");
        var temp = body.findAttr("id=tempdiv");
        //copy our current section to temp div
        temp.append(el);
        //get the copied section
        var elcpy = temp.findClass("section").eq(0);
        //remove subsections in the copy
        elcpy.findClass("section").delete();
        //remove the temp div
        temp.delete();
        return {
            title: el.findTag(hlev).toText()[0],
            id:    el.getAttr("id")[0],
            level: level,
            text: elcpy.toText()[0],
            html: elcpy.toHtml()[0]
        }
    }

    for (i=0; i<sections.length; i++)
    {
        var el=sections.eq(i);

        if     ( el.findTag('h1').length==1 )
            els.push(getSect(1,el));
        else if( el.findTag('h2').length==1 )
            els.push(getSect(2,el));
        else if( el.findTag('h3').length==1 )
            els.push(getSect(3,el));
        else if( el.findTag('h4').length==1 )
            els.push(getSect(4,el));
    }

    return els;
}

/* copy source/text files and static files and create client_search.js */

function copy_files(path, docpath, destpath){
    var i, ret;

    ret = shell(`cp -a ${docpath}/_static ${destpath}/`);

    if(ret.exitStatus)
        throw(ret.stderr);

    ret = shell(`cp -a ${docpath}/_sources ${destpath}/`);
    if(ret.exitStatus)
        throw(ret.stderr);

    fprintf(destpath + "/_static/client_search.js", '%s',
`$(document).ready(function(){
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
        sdiv.html('<div style="cursor: pointer; float:right; border: 1px gray solid; border-radius:10px;width: 20px;height: 20px;position: relative;padding-left: 0.17em;" id="sclose">X</div>');
        $.getJSON(
            "/apps/docs/rsearch/results.json",
            {q:q},
            function(res)
            {
                var r = res.rows;
                sdiv.append("<h3>Search Results:</h3><p><p>");
                for (var i=0;i<r.length;i++)
                {
                    sdiv.append('<p><span class="linked"><a class="linked" href="/docs/' +r[i].plink+ '">' + r[i].plink.replace(/\.html#.*/,'') + ' : ' +r[i].full+ '</a></span>');
                    sdiv.append(
                        '<div data-base="'+ r[i].plink.replace(/\#.*/,'')  +'" class="searchsect">'+
                        //'<span class="expand" style="position: absolute;top: 6px;right: 6px;">&nbsp;CLICK TO EXPAND&nbsp;</span>'+
                        r[i].html+
                        '<div class="fader"><div class="cont" style="bottom:3px; left:15px; position: relative;">...</div><div class="expand" style="bottom: 3px; right:15px; position: absolute;">Show More</div></div>');
                }
                if(r.length==0)
                {
                    sdiv.append('<p>No Results for "'+q+'"</p>');
                }
                else
                {
                    var links = sdiv.find("a.linked");
                    var hlinks = sdiv.find("a.headerlink");
                    var i=0;
                    for (;i<links.length;i++) {
                        var hx = hlinks.eq(i).parent();
                        hlinks.eq(i).remove();
                        var txt = hx.text();
                        hx.html('<a class="linked" href="' + links.eq(i).attr("href")+'">' + txt + '</a>');
                    }
                    $(".searchsect").each(function(){
                        var t=$(this);
                        if(t.height() < 248)
                        {
                            t.find(".fader").hide();
                        }
                    });
                }

                $('.linked').click(function(e){
                    $('#searchres').remove();
                    $("div[itemprop=articleBody],.rst-footer-buttons").show();
                });

                $('.expand').click(function(e){
                    var t = $(this);
                    var sect = t.closest(".searchsect");
                    
                    if (sect.hasClass('expanded'))
                    {
                        t.html("show more");
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


});
`);
}

/* return true if all files in webserver destpath are newer than source files */
function is_current(docpath, destpath) {
    var files = readdir(docpath + "/").filter(function(dir){ return /\.html/.test(dir); });
    for (var j=0; j<files.length;j++) {
        var ofile = docpath  + "/" + files[j];
        var nfile = destpath + "/" + files[j];
        var ostat = stat(ofile);
        var nstat = stat(nfile);
        if (!nstat || ostat.mtime > nstat.mtime)
            return false;
    }
    return true;
}

/* parse source files with some rewrites, get doc text to be searched and create search db */
function make_database(docpath,destpath) {

    /* drop existing table, if exists */
    var res = sql.exec("select * from SYSTABLES where NAME = 'sections'");
    if(res.rowCount)
    {
        sql.exec("drop table sections;");
    }

    /* create table */
    sql.exec("create table sections (title varchar(16), full varchar(64), plink varchar(32), level int, text varchar(128), html varchar(256) );");

    // an array of the list of *.html files in docpath
    var files = readdir(docpath + "/").filter(function(dir){ return /\.html/.test(dir); });

    for (var j=0; j<files.length;j++) {
        var file=files[j];
        var els = parse_html_file(docpath + "/"+file, destpath + "/"+file);
        var fullpath=[];
        for (i=0; i<els.length; i++)
        {
            var el=els[i];
            //var indent=(el.level-1) * 4; //for debugging code below

            /* create title links for sections, e.g. 
               "rampart-server : the rampart-server http module : loading and using the module : configuring and starting the server : start()" */
            var title = el.title.replace(/ ¶ /,"").toLowerCase();//remove pesky ¶ symbols in title tags

            fullpath[el.level-1] = title;
            fullname = fullpath.slice(0,el.level).join(' : ')

            link = file + "#" + title.replace(/[ \.\/]/g,'-').replace(/[\(\)]/g,'');

            // Some debugging code:
            //printf("SECTION %s, level:%d, length %d\n", link, el.level, el.text.length);
            //printf("%*P\n%!*P\n", indent, title, indent+2, el.text);

            sql.exec(
                "insert into sections values(?, ?, ?, ?, ?, ?);",
                [title, fullname, link, el.level, el.text, el.html]
            );
        }
    }
}

function make_index() {
    sql.set({
        keepNoise: true
    });
    sql.exec("create index sections_title_x on sections(title);");
    sql.exec("create fulltext index sections_full_text_mmix on sections(full\\text) " +
             "WITH WORDEXPRESSIONS "+
             "('[\\alnum]+', '[\\alnum_,]+', '[\\alnum_]+>>()=', '[\\alnum_]+(=>>[\\alnum_\\,\\. ]{1,25})=')" +
             "INDEXMETER 'on'"
    );
}

var webuser;

function build_db() {
    var path, docpath, destpath, dbpath;

    path=process.scriptPath;

    // remove "/apps/docs"
    path = path.replace(/\/[^\/]+\/[^\/]+$/, "");

    dbpath = path + "/data/docs/db";

    sql = new Sql.init(dbpath,true);

    var trypaths = [
        "../../../build/html", //relative to github dirs
        "/usr/local/src/rampart_docs/build/html" //absolute, if script moved
    ];

    for (var i = 0; i<trypaths.length; i++) {
        var p = trypaths[i];
        if(stat(p))
        {
            docpath=realPath(p);
            break;
        }
    }
    if(!docpath)
        throw("Couldn't find html documents");
    
    destpath = path + "/html/docs";
    
    if(!stat(destpath))
        mkdir(destpath);

    if(webuser) {
        var ret = shell(`chown -R ${webuser} ${destpath}`); 

        if(ret.exitStatus)
            throw(ret.stderr);
    }

    if(process.argv[2] != '-f' && is_current(docpath, destpath))
    {
        console.log("docs are up to date");
        return;
    }

    copy_files(path, docpath, destpath);

    make_database(docpath, destpath);
    
    make_index();

    if(webuser)
    {
        ret = shell(`chown -R ${webuser} ${destpath}`); 

        if(ret.exitStatus)
            throw(ret.stderr);

        ret = shell(`chown -R ${webuser} ${dbpath}`); 

        if(ret.exitStatus)
            throw(ret.stderr);
    }
}

// Command line, or module?
if(module && module.exports) {
    module.exports = {
        "suggest.json": suggest,
        "results.json": results
    }
} else {
    // Set "webuser" to chown the database to another user if running as root.
    // This is also taken care of in start_docs_web_server.sh
    //webuser='nobody';

    build_db();
}

