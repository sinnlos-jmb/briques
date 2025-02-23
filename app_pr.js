
const express = require('express');
require('dotenv').config()
const session = require("express-session");
const fs = require('fs');
const https = require('https');

const lib = require("./funciones_agro");
const lib_c = require("./consts");


///////////   consts en app.locals     ////////////
function get_vec_productos(add_populate) { //populating solo se usa en new producto y portal agregar parametro para condicional
	if (add_populate)
		return lib_c.js_populate+"\n vec_categs= "+JSON.stringify(app.locals.objs_static.vec_productos)+";\n";
	else
		return "\n vec_categs= "+JSON.stringify(app.locals.objs_static.vec_productos)+";\n";
}


function get_vec_mercados() {
	return "let vec_mercados="+JSON.stringify(app.locals.objs_static.vec_mercados)+";";
	}

function get_opt_mercados() {
	let rta="";
	for (let i=1; i<app.locals.objs_static.vec_mercados.length; i++) {
		rta+="<option value='"+app.locals.objs_static.vec_mercados[i].id+"'>"+app.locals.objs_static.vec_mercados[i].nombre+"</option>";
		}
	return rta;
	}


function get_vec_localidades() {
	return lib_c.js_deptos+"\n let vec_deptos_ok= "+JSON.stringify(app.locals.objs_static.vec_deptos)+";\n";
	}
		
function get_opts_provincias() {
	return app.locals.objs_static.opts_provincias;
	}



///////////////////////////
//////// rutas ////////////
///////////////////////////
 var app = express();
 let options = {  maxAge: '2y', etag: false};
 app.use(express.static('public', options));
 app.use(session({secret: "1234", resave: false, saveUninitialized: false,}));



 // root
 app.get('/', function (req, res) {
	if (req.session.nav_bar==null) {req.session.nav_bar=''};
	const op = req.query.op || '';
	const agente = {usuario:req.query.nom_usuario || '', pwd:req.query.pwd_usuario || '', id:req.query.id_agente || '', tipo:req.query.tipo_agente || '', nombre:req.query.nom_agente || '', apellido:req.query.apellido_agente || '', respa:req.query.respa || '', domicilio:req.query.domicilio || '', ubicacion:req.query.ubicacion || '0'};
	let head="", rta="", params={op:"", query:""};

	if (typeof app.locals.objs_static==="undefined") {	
		lib_c.asyncDB_engage().then(
			function(value) {
				app.locals.objs_static=value;
				head=value.consts.head;
				
				res.redirect('/');
				},
			function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
			);
		}

	else if (op=='') {
		let rta_nav="";
		params.op="all";
		params.query="SELECT id_agente, usuario, pwd, nombre_agente, apellido_agente, domicilio_agente, id_ubicacion_agente, tipo_agente,  IFNULL(DATE_FORMAT(fecha_nacimiento_agente , '%d/%m/%Y'), '01/01/2001') nacimiento, respa "+ 
					"from Agentes limit 10";
		lib.asyncDB_getAgentes(params).then(
			function(value) {
				rta=app.locals.objs_static.consts.head+"</head><body>"+
				app.locals.objs_static.consts.grids_main.header;
				if (!req.session.logged) {
					rta+=lib_c.html_form_login;
					}
				else {
					rta+=lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido});
					}
				rta+=req.session.nav_bar+"</div> \n "+ //cierro div del header.login
					
				app.locals.objs_static.consts.grids_main.article+ //</header><article id='mainArticle'>
				app.locals.objs_static.consts.grids_publics.start+ // <div class='grid_main_public'> 

				app.locals.objs_static.consts.grids_publics.post_nav+ // <header_flex id='publicHeaderFlex'>
				"</header_flex>"+
				"<article2 id='publicArticleHome'> <div class='intro' style='text-align: left;'><h2>Buenos Briques!</h2><h3>Relaciones justas de beneficio mutuo entre productores y consumidores</h3>"+
				value+"</div> <div class='links'>links directos</div> <div class='destacados'>destacados - promos</div> "+
				"<div class='new'>noticias</div> <div class='jornadas'><img src='/images/agro_s.jpg' style='max-width: 100%; height: auto;' alt='Briques comercio agropecuario!' loading='lazy'></div>"+
				"<div class='clima'>clima</div> \n"+
				"</article2></div>"+app.locals.objs_static.consts.grids_main.nav+
				app.locals.objs_static.consts.grids_main.ads+
				app.locals.objs_static.consts.grids_main.footer+" \n </body>\n</html>"; 		
								
				//res.set('Cache-Control', 'public, max-age=31557600'); // one year
				res.send(rta);
				},
			function(error) {res.send(app.locals.objs_static.consts.error+error+"</body></html>");}
			
			);
					

			
		}
	else if (op=='login') {
		params.op="login";
		params.query="SELECT id_agente, usuario, pwd, nombre_agente, apellido_agente, domicilio_agente, id_ubicacion_agente, tipo_agente,  IFNULL(DATE_FORMAT(fecha_nacimiento_agente , '%d/%m/%Y'), '01/01/2001') nacimiento, respa "+
					"from Agentes where usuario='"+agente.usuario+"' and pwd='"+agente.pwd+"'";
		lib.asyncDB_getAgentes(params).then(
			function (value) { //consultar agente.id para saber si encontró o no al usuario.
				if (value.agente.id!=null){
					req.session.logged=true;
					req.session.agente=value.agente;
					let temp_functions="</ul>";
					if (value.agente.tipo=='A') { 
						temp_functions=app.locals.objs_static.consts.f_admins;	
						}
					if (value.agente.tipo!='U') { /*agregaba funcion nueva public*/	}
					req.session.functions=temp_functions;
					req.session.nav_bar="<ul>"+app.locals.objs_static.consts.nav_bar.home+app.locals.objs_static.consts.nav_bar.portal+" <li><a href='"+lib_c.get_links_agente("tablero?op=ok", value.agente)+"'>Mi Tablero</a><li> "+temp_functions;

					res.redirect(lib_c.get_links_agente("tablero?op=ok", value.agente)+"&ubicacion="+value.agente.ubicacion+"&domicilio="+value.agente.domicilio);
					}
				else {res.redirect("/");}
				},
			function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
			);}

	else if (op=='logout') {
		req.session.logged=false;
		req.session.nav_bar="";
		req.session.agente=null;
		res.redirect("/");
	} },);




//abm (formularios y queries: inserts / updates) para todas las tablas.
app.get('/abm', function (req, res) {
const date=new Date();
if (req.session.logged && app.locals.objs_static.engaged) { 
 let sql="";
 const op = req.query.op || '*', op2 = req.query.op2 || '*';
 const agente = {usuario:req.query.nom_usuario || '', pwd:req.query.pwd_usuario || '', id:req.query.id_agente || '', tipo:req.query.tipo_agente || '', nombre:req.query.nom_agente || '', apellido:req.query.ape_agente || '', 
 				nacimiento:req.query.nacimiento || '01/01/2001', respa:req.query.respa || '', domicilio:req.query.domicilio || '', ubicacion:req.query.ubicacion || '0', provincia:req.query.id_provincia || '0'};
 const publicacion = {id:req.query.id_publicacion || '', id_agente: agente.id || '', id_producto:req.query.id_producto || '', nom_producto: req.query.nom_producto || '', cantidad:req.query.cantidad || '', precio:req.query.precio || '', 
 						fecha: req.query.fecha_publicacion || '', ubicacion: req.query.ubicacion || '', descripcion: req.query.descripcion || '', estado: req.query.estado || '', provincia: req.query.id_provincia || '', tipo_agente_p: req.query.tipo_agente_publicacion || '', tipo_publicacion: req.query.tipo_publicacion || ''};
 const mercado={nombre:req.query.nom_mercado || '', domicilio:req.query.domicilio || '', ubicacion:req.query.ubicacion || '0', id_mercado: req.query.id_mercado || '', provincia: req.query.id_provincia || '', descripcion: req.query.descripcion_mercado || ''};

 let rtt="New agent form!", rta="";

 if (op=="np"){ //nuevo agente
	const o_rta=lib_c.get_form_agente("new_p", agente);
	rta=app.locals.objs_static.consts.head+"<script>"+get_vec_localidades()+" </script>\n </head>\n"+
			"<body>"+
			app.locals.objs_static.consts.grids_main.header+
			lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
			req.session.nav_bar+"</div> \n "+
			app.locals.objs_static.consts.grids_main.article+
			app.locals.objs_static.consts.grids_publics.start+
			"\n <header_flex id='publicHeaderFlex' style='margin-bottom:0px;'>"+
			"<h2>Nuevo Agente</h2></header_flex> \n <article2 id='publicArticle'>"+
			o_rta.inic+app.locals.objs_static.opts_provincias+o_rta.final+
			"</article2> \n\n </div>"+app.locals.objs_static.consts.grids_main.nav+
			app.locals.objs_static.consts.grids_main.ads+
			app.locals.objs_static.consts.grids_main.footer+
			" \n </body>\n</html>";
		res.send(rta);
	}
 else if (op=="new_p") { //insert nuevo agente
	sql="insert into Agentes (nombre_agente, apellido_agente, domicilio_agente, id_ubicacion_agente, tipo_agente, fecha_nacimiento_agente, respa) "+
				" Values ('"+agente.nombre+"', '"+agente.apellido+"', '"+agente.domicilio+"', "+agente.ubicacion+", '"+agente.tipo+"',STR_TO_DATE('"+agente.nacimiento+"' , '%d/%m/%Y') , '"+agente.respa+"')"; 
	lib.asyncDB_insert(sql).then(
 		function(value) {
			agente.id=value.insertId;
			res.redirect(lib_c.get_links_agente("tablero?op=ok", agente));
			},
  		function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
 		);
	}
 else if (op=="edit_p") { //editar agente
	const o_rta=lib_c.get_form_agente("update_p", agente);
	rta=app.locals.objs_static.consts.head+"<script>"+get_vec_localidades()+" </script>\n </head>\n"+
			"<body onload='let prov=vec_deptos_ok["+agente.ubicacion+"].prov; document.getElementById(\"id_provincia\").value=prov; document.getElementById(\"tipo_agente\").value=\""+agente.tipo+"\"; fill_deptos(prov, false); document.getElementById(\"ubicacion\").value=\""+agente.ubicacion+"\";'>"+
			app.locals.objs_static.consts.grids_main.header+app.locals.objs_static.consts.grids_main.article+
			app.locals.objs_static.consts.grids_publics.start;
			rta+=lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido});
			rta+=req.session.nav_bar+"\n </header_fix> \n <header_flex id='publicHeaderFlex' style='margin-bottom:0px;'>"+
			"<h2>Editar Agente</h2> \n </header_flex> \n <article2 id='publicArticle'>"+
			o_rta.inic+app.locals.objs_static.opts_provincias+o_rta.final+
			"</article2>\n\n</div>"+app.locals.objs_static.consts.grids_main.nav+
			app.locals.objs_static.consts.grids_main.ads+
			app.locals.objs_static.consts.grids_main.footer+
			" \n </body>\n</html>";
	res.send(rta);
	}
 else if (op=="update_p") { //update agente
		sql="update Agentes set "+
				"nombre_agente='"+agente.nombre+"', apellido_agente='"+agente.apellido+"', domicilio_agente='"+agente.domicilio+"', "+
				"tipo_agente='"+agente.tipo+"', id_ubicacion_agente="+agente.ubicacion+", fecha_nacimiento_agente=STR_TO_DATE('"+agente.nacimiento+"', '%d/%m/%Y'), "+
				"respa='"+agente.respa+"' "+
			" where id_agente="+agente.id;
		lib.asyncDB_insert(sql).then(
			function(value) {
				res.redirect(lib_c.get_links_agente("tablero?op=ok", agente));
				},
			function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
			);
		}
		
 else if (op=="nm"){ //nuevo mercado
		if (req.session.agente.tipo!='A') {	res.redirect("/");	}
		else {
			rta=app.locals.objs_static.consts.head+"\n<script>"+get_vec_localidades()+" </script> </head>\n"+
				"<body>\n "+
				app.locals.objs_static.consts.grids_main.header+
				lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
				req.session.nav_bar+"</div> \n "+
				app.locals.objs_static.consts.grids_main.article+
				app.locals.objs_static.consts.grids_publics.start+
				
				"<header_flex id='publicHeaderFlex' style='margin-bottom:0px;'>"+
				"<h2>Nuevo Mercado</h2> \n </header_flex><article2 id='publicArticle'>";
	
				const o_rta=lib_c.get_form_mkt();
				rta+=o_rta.inic+get_opts_provincias()+o_rta.final+
				"</article2></div>"+app.locals.objs_static.consts.grids_main.nav+
				app.locals.objs_static.consts.grids_main.ads+
				app.locals.objs_static.consts.grids_main.footer+
				" \n </body>\n</html>";
			res.send(rta);
			}
		}
 else if (op=="new_m") { //alta del nuevo mercado
	if (req.session.agente.tipo!='A') { res.redirect("/");	}
	sql="insert into Mercados (nombre_mercado, id_ubicacion, direccion_mercado, descripcion) "+
				" Values ('"+mercado.nombre+"', "+mercado.ubicacion+", '"+mercado.domicilio+"', '"+mercado.descripcion+"')"; 

 	lib.asyncDB_insert(sql).then(
 		function(value) {
			rta=lib_c.get_links_agente("tablero?op=ok", req.session.agente)+"&id_mercado="+value.insertId;
			lib_c.asyncDB_engage().then( //re-engage por cambio en tabla Mercados

			function(value) {
				app.locals.objs_static=value;
				},
			function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
			);
			res.redirect(rta);
			},
  		function(error) {res.send(app.locals.objs_static.consts.error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
 		);
	}

 else if (op=="nq"){  //nueva publicacion
		rta=app.locals.objs_static.consts.head+"\n<script>"+get_vec_productos(false)+get_vec_localidades()+" </script></head>\n\n "+
			"<body onload='fill_0(null);'>\n "+
			app.locals.objs_static.consts.grids_main.header+
			lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
			req.session.nav_bar+"</div> \n "+
			
			app.locals.objs_static.consts.grids_main.article+
			app.locals.objs_static.consts.grids_publics.start+
			app.locals.objs_static.consts.grids_publics.post_nav+

			"<h2>Nueva Publicacion</h2> \n </header_flex> \n <article2 id='publicArticle'>";
		publicacion.fecha=date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear();
		const rta_o=lib_c.get_form_public('new_q', publicacion, agente);
		rta+=rta_o.inic+get_opts_provincias()+rta_o.final+
			"\n </article2> \n\n </div>"+app.locals.objs_static.consts.grids_main.nav+
			app.locals.objs_static.consts.grids_main.ads+
			app.locals.objs_static.consts.grids_main.footer+
			" \n </body>\n</html>";
		res.send(rta);
		}
 else if (op=="new_q"){
	sql="insert into Publicaciones_agente (id_agente, id_producto, cantidad_producto, descripcion_publicacion, precio_producto, id_ubicacion, fecha_publicacion, tipo_publicacion, tipo_agente, estado_publicacion) "+
		" Values ("+publicacion.id_agente+", "+publicacion.id_producto+", '"+publicacion.cantidad+"', '"+publicacion.descripcion+"', '"+publicacion.precio+"', "+publicacion.ubicacion+", CURRENT_DATE(), '"+publicacion.tipo_publicacion+"', '"+publicacion.tipo_agente_p+"', '1')";
	lib.asyncDB_insert(sql).then(
		function(value) {
			res.redirect(lib_c.get_links_agente("tablero?op=ok", req.session.agente)+"&new_public_id="+value.insertId);
			},
		function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
		);
	}
 else if (op=="edit_q"){  //form para editar publicacion
	rta=app.locals.objs_static.consts.head+"\n <script type='text/javascript'> "+get_vec_productos(false)+get_vec_localidades()+" </script></head>\n\n "+
		"<body onload=\"fill_0({ubic:"+publicacion.ubicacion+", prov:"+publicacion.provincia+", id_prd:"+publicacion.id_producto+", nom_prd:'"+publicacion.nom_producto+
		"', tipo_publicacion: '"+publicacion.tipo_publicacion+"', tipo_agente_p: '"+publicacion.tipo_agente_p+"', fecha: '"+publicacion.fecha+"'}); \">\n "+
		app.locals.objs_static.consts.grids_main.header+
		lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
		req.session.nav_bar+"</div> \n "+
		app.locals.objs_static.consts.grids_main.article+
		app.locals.objs_static.consts.grids_publics.start+
		"\n <header_flex id='publicHeaderFlex' style='margin-bottom:0px;'>"+
		"<h2>Editar publicacion</h2> \n </header_flex> \n <article2 id='publicArticle'>";
	const rta_o=lib_c.get_form_public('update_q', publicacion, agente);
	rta+=rta_o.inic+get_opts_provincias()+rta_o.final+
		"\n </article2>\n\n</div>"+app.locals.objs_static.consts.grids_main.nav+
		app.locals.objs_static.consts.grids_main.ads+
		app.locals.objs_static.consts.grids_main.footer+
		" \n </body>\n</html>";
	res.send(rta);
	}

 else if (op=="update_q") { //update publicacion
	sql="update Publicaciones_agente set "+
			"id_producto="+publicacion.id_producto+", cantidad_producto='"+publicacion.cantidad+"', descripcion_publicacion='"+//STR_TO_DATE('"+publicacion.fecha+"', '%d/%m/%Y')
			publicacion.descripcion+"', precio_producto='"+publicacion.precio+"', id_ubicacion="+publicacion.ubicacion+", fecha_publicacion=STR_TO_DATE('"+publicacion.fecha+"', '%d/%m/%Y'), "+
			"tipo_publicacion='"+publicacion.tipo_publicacion+"', tipo_agente='"+publicacion.tipo_agente_p+"' "+
		" where id_publicacion="+publicacion.id;
	lib.asyncDB_insert(sql).then(
		function(value) {
			res.redirect(lib_c.get_links_agente("tablero?op=ok", agente));
			},
		function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
		);
	}
 else if (op=="estado_q") { //reactivar publicacion

	if (op2=="reactivar") {
		sql="update Publicaciones_agente set "+
			"fecha_publicacion=CURRENT_DATE(), estado_publicacion='1' "+
		" where id_publicacion="+publicacion.id;
		}
	else if (op2=="desactivar") {
		sql="update Publicaciones_agente set estado_publicacion='0' where id_publicacion="+publicacion.id;
		}
	else if (op2=="eliminar") {
		sql="update Publicaciones_agente set estado_publicacion='*' where id_publicacion="+publicacion.id;
		}
	lib.asyncDB_insert(sql).then(
		function(value) {
			res.redirect(lib_c.get_links_agente("tablero?op=ok", agente));
			},
		function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
		);
	}

 else if (op=="nr"){  //nuevo producto
	if (req.session.agente.tipo!='A') {	res.redirect("/"); 	}
	rta=app.locals.objs_static.consts.head;
	const prd = {op2:req.query.op2 || '', nombre:req.query.nom_prd || '', nombre_producto:req.query.categ || '', new_categ:req.query.new_categ || 'null', categ0:req.query.categ0 || 'null', categ1:req.query.categ1 || 'null', categ2:req.query.categ2 || 'null', categ3:req.query.categ3 || 'null', categ4:req.query.categ4 || 'null'};
	rta+="\n<script type='text/javascript'> "+get_vec_productos(true)+"</script>\n\n "+ lib_c.get_js_productos(prd)+"</head>\n\n "+
		"<body onload='fill_1();'>\n "+
		app.locals.objs_static.consts.grids_main.header+
		lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
		req.session.nav_bar+"</div> \n "+		
		app.locals.objs_static.consts.grids_main.article+
		app.locals.objs_static.consts.grids_publics.start+
		app.locals.objs_static.consts.grids_publics.post_nav+
		"<h2>Nuevo Producto</h2> \n </header_flex> \n <article2 id='publicArticle'>"+
		
		lib_c.html_new_prd+
		"</article2> \n\n </div>"+app.locals.objs_static.consts.grids_main.nav+
			app.locals.objs_static.consts.grids_main.ads+
			app.locals.objs_static.consts.grids_main.footer+
			" \n </body>\n</html>";
	res.send(rta);
	}
 else if (op=="new_r"){  //save new product
	if (req.session.agente.tipo!='A') {
		res.redirect("/");
		}
	const prd = {nombre:req.query.nom_prd || '', nombre_producto:req.query.categ || '', new_categ:req.query.new_categ || 'null', categ0:req.query.categ0 || 'null', categ1:req.query.categ1 || 'null', categ2:req.query.categ2 || 'null', categ3:req.query.categ3 || 'null', categ4:req.query.categ4 || 'null'};
	sql="insert into Categorias_producto (nombre_categoria, id_categoria0, id_categoria1 , id_categoria2 , id_categoria3, id_categoria4, nombre_producto) "+
		"Values ('"+prd.nombre+"', "+prd.categ0+", "+prd.categ1+", "+prd.categ2+", "+prd.categ3+", "+prd.categ4+", lower('"+prd.nombre_producto+"') )";
	lib.asyncDB_insert(sql).then(
		function(value) {
			lib_c.asyncDB_engage().then( //re-engage por nueva categoria-producto
				function(value2) {
					app.locals.objs_static=value2;
					},
				function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
				);

			res.redirect("/abm?op=nr&op2=ok&categ0="+prd.categ0+"&categ1="+prd.categ1+"&categ2="+prd.categ2+"&categ3="+prd.categ3+"&categ4="+prd.categ4+"&new_prd="+prd.nombre);
				},
		function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
		);
	}
			
 else if (op=="nu") { //nueva ubicacion, nueva localidad en un depto ya cargado
	if (req.session.agente.tipo!='A') {
		res.redirect("/");
		}
	rta=app.locals.objs_static.consts.head+"</head><body><p>nueva ubicacion en provincia</p><p></p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>";
	res.send(rta);
	}
}
else {res.redirect("/"); }  //not logged
});



// portal para navegar por info: 
app.get('/portal', function (req, res) {

 const params={op:req.query.op || '', id_prd2:req.query.id_prd2 || '0', id_prd3:req.query.id_prd3 || '0', id_prd4:req.query.id_prd4 || '0', id_prd5:req.query.id_prd5 || '0', 
 				id_mercado:req.query.id_mercado || '*', nom_mercado:req.query.nom_mercado || '*', 
				id_ubic:req.query.id_ubic || '', id_provincia: req.query.id_provincia || '', nom_ubic:req.query.nom_ubic || '', 
				tipo_agente:req.query.tipo_agente || '', tipo_publicacion:req.query.tipo_publicacion || ''};
 
 if (req.session.logged && app.locals.objs_static.engaged) {
	lib.asyncDB_getPortal(params).then(
		function(value) {
			rta=app.locals.objs_static.consts.head+
				"<script>"+get_vec_productos(true)+get_vec_localidades()+" </script></head> \n"+
				"<body> \n"+
				app.locals.objs_static.consts.grids_main.header+
				
				lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
				req.session.nav_bar+"</div> \n "+

				app.locals.objs_static.consts.grids_main.article+
				app.locals.objs_static.consts.grids_publics.start+
				app.locals.objs_static.consts.grids_publics.post_nav+				

				"<h2>Publicaciones / Grillas</h2>"+
				"<input type='checkbox' id='accord1' class='accord'/> <label for='accord1' class='acc_label'><table width='100%'><tr><td style='font-size:18px'>Filtrar publicaciones</td><td></td><td style='font-size:22px; font-weight:bold; text-align:right'>&#8597;</td></tr></table></label>	<div class='acc_content'>  "+  //accordion
				"<table border='2'><tr><td>Mercado:</td><td> \n<select id='mercados'><option value='0' selected>Seleccionar</option>"+
				get_opt_mercados()+"</select></td>"+
						"<td style='vertical-align:top' rowspan='4'>Productos<br>"+
						"<table> <tr><td valign='top'><select id='select0'> <option value='1' selected>Horticola</option><option value='2'>Ganadero</option> </select></td></tr> <tr><td> <select id='select1' onchange='populating(this.value, 3)' style='width:99px'> <option value='0' selected>Seleccionar</option> <option value='3'>hoja</option><option value='4'>fruto</option> </select> </td></tr> \n "+
						" <tr><td> <select id='select3' onchange='populating(this.value, 4);' style='width:99px'>  <option value='0'>categ0</option> </select> </td></tr> <tr><td> <select id='select4' onchange='populating(this.value, 5)' style='width:99px'>  <option value='0'>categ1</option> </select> </td></tr> <tr><td> <select id='select5' style='width:99px'>  <option value='0'>categ2</option> </select> </td></tr> <tr><td> </td></tr> "+
						"</table>"+
						"</td></tr>"+
						"<tr><td>Fecha: </td><td><a href='/portal?op=fecha&val=semana_actual'>Mes actual o rango</a></td></tr>"+
						"<tr><td>Agente:</td><td> <select id='tipo_agente' nombre='tipo_agente'><option value='0'>Seleccionar</option> <option value='P'>Productor</option> <option value='R'>Puestos al publico</option><option value='T'>Transportes</option></select></td></tr>"+
						"\n<tr><td>Accion:</td><td> <select id='tipo_publicacion' nombre='tipo_publicacion'><option value='0'>Seleccionar</option> <option value='V'>Vender</option> <option value='C'>Comprar</option></select></td></tr>"+
						"<tr><td>Ubicacion: </td><td><select id='id_provincia' name='id_provincia' onchange='fill_deptos(this.value, true)'>"+
						app.locals.objs_static.opts_provincias+
						"</select> <br>\n <select id='ubicacion' name='ubicacion'><option value='0'>Localidades</option><option value='0'>Todas</option></select></td><td> busqueda libre: <input type='text' name='busca' id='busca' size='8'></td></tr>"+
						"<tr><td colspan='3' style='text-align:center'><button onclick='let dd_mkt=document.getElementById(\"mercados\"), dd_agente=document.getElementById(\"tipo_agente\").value, dd_tipo_op=document.getElementById(\"tipo_publicacion\").value, s5=document.getElementById(\"select5\").value, s4=document.getElementById(\"select4\").value, s3=document.getElementById(\"select3\").value, dd_prov=document.getElementById(\"id_provincia\").value, dd_depto=document.getElementById(\"ubicacion\").value; "+
						"location.href=\"/portal?op=query&id_mercado=\"+dd_mkt.value+\"&nom_mercado=\"+dd_mkt.options[dd_mkt.selectedIndex].text+\"&tipo_agente=\"+dd_agente+\"&tipo_publicacion=\"+dd_tipo_op+\"&id_prd5=\"+s5+\"&id_prd4=\"+s4+\"&id_prd3=\"+s3+\"&id_provincia=\"+dd_prov+\"&id_ubic=\"+dd_depto+\"\"'>"+
						"GO</button>\n</td></tr></table>  </div>";
			rta+=app.locals.objs_static.consts.grids_publics.post_filter+
				value+
				app.locals.objs_static.consts.grids_publics.end+ 
				app.locals.objs_static.consts.grids_main.nav+
				app.locals.objs_static.consts.grids_main.ads+
				app.locals.objs_static.consts.grids_main.footer+
				" \n </body>\n</html>";
			res.send(rta);
			},
		function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
		);
	}
 else {res.redirect("/"); }  //not logged	

});




//agents dashboard (segun el tipo de agente muestra distintas opciones).
app.get('/tablero', function (req, res) {
 const op=req.query.op || '';
 const agente = {id:req.query.id_agente || '', tipo:req.query.tipo_agente || '', nombre:req.query.nom_agente || '', apellido:req.query.ape_agente || '', 
 		respa:req.query.respa || '', ubicacion:req.query.ubicacion || '', nacimiento:req.query.nacimiento || '01/01/2001', domicilio:req.query.domicilio || ''};
 let rta="", rta_nav="";
 if (!req.session.logged || (req.session.agente.id !=agente.id && req.session.agente.tipo!='A')) {		
	rta+="\n <meta http-equiv='refresh' content='2; url=/'></head> \n<body><h1>ZONA PROHIBIDA</h1></body></html>";  
	res.send(rta);
	}
 else if (op=="ok") {
	const params={op:"id", agente: agente,
				  query:"select pa.id_publicacion, pa.id_producto, p.nombre_producto, pa.cantidad_producto, pa.precio_producto, pa.estado_publicacion, pa.descripcion_publicacion, "+
				  		"DATE_FORMAT(pa.fecha_publicacion, '%d/%m/%Y') fecha_publicacion, pa.id_ubicacion, u.id_provincia, pa.tipo_agente, "+
						"pa.tipo_publicacion  "+ 
					"from Agentes a, Publicaciones_agente pa, Categorias_producto p, Ubicaciones u "+
					"where a.id_agente="+agente.id+" and a.id_agente=pa.id_agente and p.id_categoria = pa.id_producto and pa.id_ubicacion=u.id_ubicacion "+
					"order by pa. estado_publicacion desc, pa.fecha_publicacion desc" };
	lib.asyncDB_getPublicaciones (params).then(
	   	function(value) {
			rta=app.locals.objs_static.consts.head+" </head> \n"+
				"<body> \n "+
				app.locals.objs_static.consts.grids_main.header+
				lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
				req.session.nav_bar+"</div> \n "+

				app.locals.objs_static.consts.grids_main.article+
				app.locals.objs_static.consts.grids_publics.start+
				app.locals.objs_static.consts.grids_publics.post_nav+
				"<h2>Mis Publicaciones</h2>";
			if (agente.id!=req.session.agente.id) {rta+="<button onclick='location.href=\""+lib_c.get_links_agente("abm?op=edit_p", agente)+"\"'> Editar Agente</button><br>";}
			rta+="<button onclick=\"document.location='/abm?op=nq&id_agente="+ agente.id+
				"&tipo_agente="+ agente.tipo+ "&nom_agente="+ agente.nombre+"&ape_agente="+ agente.apellido+
				"&respa="+ agente.respa+"'\">Nueva publicacion</button><br>";
			rta+=app.locals.objs_static.consts.grids_publics.post_filter+
				value+
				app.locals.objs_static.consts.grids_publics.end+"\n "+
				app.locals.objs_static.consts.grids_main.nav+
				app.locals.objs_static.consts.grids_main.ads+
				app.locals.objs_static.consts.grids_main.footer+
				" \n </body>\n</html>";
			res.send(rta);
			},
	  	function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
		);
	}
 else if (op=="sa") { //buscar agente
	const busca=req.query.busca_agente || ''; 
	let params={op:"sa", query:"select * from Agentes where apellido_agente LIKE '"+busca+"%' limit 12"};
	lib.asyncDB_getAgentes (params).then(
		function(value) {
			rta=app.locals.objs_static.consts.head+" </head> \n"+
			"<body> \n "+
			app.locals.objs_static.consts.grids_main.header+app.locals.objs_static.consts.grids_main.article+
			app.locals.objs_static.consts.grids_publics.start+
			lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
			req.session.nav_bar+app.locals.objs_static.consts.grids_publics.post_nav+
			"<h2>Busqueda Agente</h2> \n </header_flex>"+
			value+
			"</div>"+app.locals.objs_static.consts.grids_main.nav+
			app.locals.objs_static.consts.grids_main.ads+
			app.locals.objs_static.consts.grids_main.footer+
			" \n </body>\n</html>";
			res.send(rta);
			},
		function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
		);
	}
 else if (op=="n_gril") { //nueva grilla
	rta=app.locals.objs_static.consts.head+"<script>"+get_vec_productos(false)+"\n "+ get_vec_mercados()+" \n </script> \n </head> \n"+
		"<body onload='fill_0(null); fill_mkt();'> \n "+
		app.locals.objs_static.consts.grids_main.header+
		lib_c.get_logout({nombre:req.session.agente.nombre, apellido:req.session.agente.apellido})+
		req.session.nav_bar+"</div> \n "+
		
		app.locals.objs_static.consts.grids_main.article+
		app.locals.objs_static.consts.grids_publics.start+
		app.locals.objs_static.consts.grids_publics.post_nav+
		"<h2>Cargar Grilla</h2> \n </header_flex>  \n <article2 id='publicArticle'>"+
		lib_c.html_form_new_grilla+
		"</article2> \n\n </div>"+
		app.locals.objs_static.consts.grids_main.nav+
		app.locals.objs_static.consts.grids_main.ads+
		app.locals.objs_static.consts.grids_main.footer+
		" \n </body>\n</html>";
	res.send(rta);
		}
 else if (op=="new_gril"){  //save new grilla
		if (req.session.agente.tipo!='A') {
			res.redirect("/");
			}
		const grilla = {lista_prds:req.query.pre_grilla || '', fecha:req.query.fecha_gril || '', id_mk:req.query.select_mercado || ''};
		//id_prd|id_mk|precio , \n lo convierte a %0D%0A y los detecto con String.fromCharCode(13, 10)
		const newline=grilla.lista_prds.indexOf(String.fromCharCode(13, 10));
		const d = new Date();
		const id_mk=1, id_prd=33, precio='$14.000', fecha=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
		let rta="8: "+grilla.lista_prds.charCodeAt(8)+", 9: "+grilla.lista_prds.charCodeAt(9);
		rta="";
		sql="insert into Precios_mercados (id_mercado, id_producto, precio_producto , fecha_precio) Values ";
		const vec_rta = grilla.lista_prds.split(String.fromCharCode(13, 10));
		for (let i=0, vec_temp=[]; i<vec_rta.length-1; i++) {
			vec_temp=vec_rta[i].split("|");
			rta+="<br>id_prd: "+vec_temp[0]+", id_mk: "+vec_temp[1]+", precio: $"+vec_temp[2];
			sql+="("+vec_temp[1]+", "+vec_temp[0]+", '"+vec_temp[2]+"', '"+fecha+"'), ";
			}
		sql=sql.substring(sql.length-2, 0);


		lib.asyncDB_insert(sql).then(
			function(value) { //corregir vec_mercados no longer id as index
				res.redirect("/portal?id_mercado="+grilla.id_mk+"&nom_mercado="+app.locals.objs_static.vec_mercados[grilla.id_mk]+"&new_registers="+value.affectedRows);
					},
			function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
			);
		}
else { res.send("zona sin funciones, op no es ok ni sa ni n_gril"); 	}

});


//apis
app.get('/api', function (req, res) {
	const id_prov = req.query.id_prov || '*';
	const op = req.query.op || '*';
	if (!req.session.logged ) {	res.redirect("/"); 	}
	else if (op=='deptos'){
		lib_c.asyncDB_get_vec_deptos(id_prov).then(
			function(value) {
					res.set('Content-Type', 'text/plain');
					res.send(value);
					},
			function(error) {res.send(app.locals.objs_static.consts.error+error+"</p>"+app.locals.objs_static.consts.nav_bar.home+"</body></html>");}
			);
		}
});






app.listen(lib_c.port, function () {
	console.log('Briques.com.ar running on port: '+lib_c.port);
  });

https
  .createServer(
    { key: fs.readFileSync('./public/ssl/briques.com.ar.key'),
    cert: fs.readFileSync('./public/ssl/briques.com.ar.cer') },
    app )
  .listen(3003, function () {
  console.log('Briques.com.ar listening on port 3003. SECURED by tls!');
});