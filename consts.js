const mariadb = require('mariadb');

const host_db =process.env.host_db;
const user_db =process.env.user_db;
const pwd_db =process.env.pwd_db;
const dbase =process.env.dbase;
const pool_size =process.env.pool_size || 4;
const port = process.env.port || 3000;

const js_populate="\n function populating (nro, k) { let dropdown = document.getElementById('select'+k); dropdown.length =0; if (dropdown.size<2) {dropdown[0] = new Option('Seleccionar categoria', 0);} \n for (let i = 0; i < vec_categs.length; i++) { "+
                    "if (Object.values(vec_categs[i])[k]==nro && Object.values(vec_categs[i])[k+1]==null) { dropdown[dropdown.length] = new Option(vec_categs[i].nombre_categoria, vec_categs[i].id);	} } for (let i=k+1; i<6;i++){ document.getElementById('select'+i).length=0; } };",
    js_deptos="\n function fill_deptos (id_prov, include_all) { const dd_deptos=document.getElementById('ubicacion'); dd_deptos.length=0;  if (include_all) {dd_deptos[0] = new Option('--Todas--', 0);} 	for (let i=1; i<vec_deptos_ok.length;i++) { if (vec_deptos_ok[i].prov==id_prov) { dd_deptos[dd_deptos.length] = new Option(vec_deptos_ok[i].nom, i);} } } \n",
    html_form_login="<div id='f_login' class='f_login'><form action='/'> \n<label for='nom_usuario'>Usuario:</label><input type='text' id='nom_usuario' name='nom_usuario' class='input1 input_m s_hov'>\n <label for='pwd_usuario'>"+
    "Clave:</label> <input type='password' id='pwd_usuario' name='pwd_usuario' class='input1 input_s s_hov'>\n <input type='hidden' id='op' name='op' value='login'> \n<input type='submit' value='OK' class='btn1 s_hov' style='width: 40px'></form> </div>\n",
    html_new_prd="<table style='width:140px'>\n" +  //population con param 2 equivale a categ0
        "<tr><td valign='top'><select id='select1' onchange='populating(this.value, 2)' size='2'>\n <option>categ raiz</option> </select></td>\n" +
        "<td valign='top'> <select id='select2' onchange='populating(this.value, 3)' onclick='setHiddens(this);' size='2' style='width:60px'>\n" +
        " <option>categ0</option> </select>\n <br> \n <button onclick='new_categ(0);'>agregar</button>\n <br> <div id='adding_categs0'></div>"+
        "</td>\n \n" +
        "<td valign='top'> <select id='select3' onchange='populating(this.value, 4)' onclick='setHiddens(this);' size='4' style='width:80px'>\n" +
        " <option value='0'>categ1</option>\n </select>\n <br> \n <button onclick='new_categ(1);'>agregar</button>\n <br> <div id='adding_categs1'></div>"+
        "</td>\n" +
        "<td valign='top'> <select id='select4' onchange='populating(this.value, 5)' onclick='setHiddens(this);' size='4' style='width:80px'>\n" +
        " <option value='0'>categ2</option> </select>\n <br> \n <button onclick='new_categ(2);'>agregar</button>\n <br> \n <div id='adding_categs2'></div>"+
        "</td>\n" +
        "<td valign='top'> <select id='select5' onclick='setHiddens(this);' size='4' style='width:80px'>\n" +
        " <option value='0'>categ3</option>\n </select>\n <br> \n <button onclick='new_categ(3);'>agregar</button>\n <br> \n <div id='adding_categs3'></div>"+
        "</td>\n </tr>\n" +
        "<tr><td colspan='5'><input type='text' id='id_producto' name='id_producto' size='4'> <input type='text' id='categs' name='categs' size='23'>\n\n "+
        "</td> </tr></table>\n <br>";
    html_criterios_portal0="</select> <br> \n"+
        "</td>"+
        "<td valign='top'>Producto: <br>"+
        ""+
        "<td valign='top'>";
    html_criterios_portal1="  <br>"+
        " <br> \n"+
        "",
    html_form_new_grilla="\n <form action='/tablero'><input type='hidden' name='op' value='new_gril'> \n "+
        "<table><tr><td colspan='2'>Mercado a cargar</td></tr>\n "+
        "<tr><td valign='top'><input type='text' name='busca_mercado' id='busca_mk' size='9'> </td><td><select name='select_mercado' id='select_mk' size='4' style='width:190px'> <option value='0'>...</option></select></td></tr>"+
        "<tr><td colspan='2'>Producto a cargar</td></tr>\n "+
        "<tr><td valign='top'><input type='text' name='buscador' id='buscador' size='9'><br><input type='text' id='new_prd' size='10' autocomplete='off'> \n<button type='button' onclick='add_grilla();'>Add !</button> <br> "+
        "<td><select name='select_producto' id='results' size='5' style='width:190px'> <option value='0'>...</option></select></td></tr> \n "+
        "<tr><td colspan='2'> <textarea id='pre_grilla' name='pre_grilla' rows='5' cols='30'></textarea> </td></tr>\n </table>\n<button type='submit'>Guardar</button></form> \n\n";


const pool = mariadb.createPool({
	host: host_db,
	user:user_db,
	password: pwd_db,
	database: dbase,
	connectionLimit: pool_size
});


	function get_links_agente(p_ruta, p_ag) {  //ruta+op, objeto agente: cuando admins agregan publicacion en tablero de agentes comunes
		return "/"+p_ruta+"&id_agente="+p_ag.id+"&tipo_agente="+p_ag.tipo+"&nom_agente="+p_ag.nombre+"&domicilio="+p_ag.domicilio+
				"&ape_agente="+p_ag.apellido+"&respa="+p_ag.respa+"&ubicacion="+p_ag.ubicacion+"&nacimiento="+p_ag.nacimiento;
		}

    function get_logout(p_nom) {
        return "\n<a href='/?op=logout'class='name_logout'>"+p_nom.nombre+" "+p_nom.apellido+"</a> ";
        }

    function get_form_agente(p_op, agente) {  //new_p o update_p
        return {inic:"<table class='table_forms'><tr><td class='td_form_cols'></td><td>\n  <form action='abm'> \n<table><tr><td> <label for='nom_agente'>Nombre:</label> </td><td> <input type='text' id='nom_agente' name='nom_agente' value='"+agente.nombre+"' class='input1 s_hov' required></td></tr>\n "+
                    "<tr><td>\n<label for='ape_agente'>Apellido:</label> </td><td>\n <input type='text' id='ape_agente' name='ape_agente' value='"+agente.apellido+"' class='input1 s_hov' required> \n </td></tr>\n"+
                    "<tr><td>\n<label for='nacimiento'>Fecha de nacimiento:</label> </td><td>\n <input type='text' id='nacimiento' name='nacimiento' value='"+agente.nacimiento+"' class='input1 s_hov' required></td></tr>\n"+
                    "<tr><td>\n<label for='domicilio'>Domicilio:</label> </td><td>\n <input type='text' id='domicilio' name='domicilio' value='"+agente.domicilio+"' class='input1 input_l s_hov'></td></tr>\n"+
                    "<tr><td>\n<label for='id_provincia'>Provincia:</label></td><td>\n <select id='id_provincia' name='id_provincia' onchange='fill_deptos(this.value, false)' class='select1 s_hov'>", 
                final:" </select>\n </td></tr> \n <tr><td><input type='text' id='busca_ubic' name='busca_ubic' class='input1 input_s'> </td> <td><select id='ubicacion' name='ubicacion' class='select1 s_hov'><option value='0'>Localidades</option></select></td></tr>\n"+
                    "<tr><td>\n<label for='respa'>Renspa:</label> </td><td>\n<input type='text' id='respa' name='respa' value='"+agente.respa+"' class='input1 s_hov'></td></tr>\n"+
                    "<tr><td>\n<label for='tipo_agente'>Tipo de agente:</label> </td><td>\n <select id='tipo_agente' name='tipo_agente' class='select1 s_hov'><option value='P' selected>Productor</option><option value='R'>Puestero</option><option value='T'>Transportista</option><option value='Q'>Proveedor</option><option value='U'>Usuario</option><option value='A'>Administrador</option></select></td></tr>\n"+
                    "<tr><td colspan='2' style='text-align:center; height:60px'> <input type='hidden' id='op' name='op' value='"+p_op+"'> <input type='hidden' id='id_agente' name='id_agente' value='"+agente.id+"'> <input type='submit' value='Guardar' class='btn1 s_hov'>"+
                    "</td></tr>\n </table></form>"+
                    "<td class='td_form_cols'> </td></tr></table> \n\n"
                };
        }


    function get_form_mkt() {  //por ahora solo nuevos mercados (op=new_m)
        return {inic:"<table class='table_forms'><tr><td class='td_form_cols'></td><td>\n <form action='abm'> \n<table><tr><td><label for='nom_mercado'>Nombre:</label> </td><td> <input type='text' id='nom_mercado' name='nom_mercado' class='input1 s_hov' required></td></tr>\n <tr><td><label for='domicilio'>Domicilio:</label></td><td> <input type='text' id='domicilio' name='domicilio' class='input1 s_hov' required></td></tr>\n "+
                    "<tr><td><label for='id_provincia'>Provincia:</label> </td><td><select id='id_provincia' name='id_provincia' class='select1 s_hov' onchange='fill_deptos(this.value, false)' required> \n", 
                final:"</select></td></tr> \n <tr><td><input type='text' id='busca_ubic' name='busca_ubic' class='input1 input_s' disabled> </td> <td><select id='ubicacion' name='ubicacion' size='4' class='select2 s_hov'><option value='0'>Localidades</option></select></td></tr>\n "+
                    "<tr><td>\n <label for='descripcion'>Descripcion:</label></td><td> <textarea id='descripcion_mercado' name='descripcion_mercado' class='input_area s_hov'> Descripcion del mercado... </textarea> </td></tr>\n"+
                    "<tr><td> <input type='hidden' id='op' name='op' value='new_m'>\n </td><td align='center'> <input type='submit' value='Guardar' class='btn1 s_hov'></td></tr></table></form>"+
                    "<td class='td_form_cols'> </td></tr></table> \n\n"
                };
        }   


    function get_form_public(p_op, public, agente) {  //new_q o update_q
        return {inic:"\n <table class='table_forms'><tr><td class='td_form_cols'></td><td>\n <form action='abm'> \n <table><tr><td> \n <label for='buscador'>Producto: </label> </td><td> <input type='text' id='buscador' class='input1 s_hov' autocomplete='off'></td></tr>\n "+
                    "<tr><td></td><td> <select id='results' onclick='setHiddens(this);' class='select2 s_hov' size='4'> <option value='0'>productos coincidentes...</option></select> \n </td></tr> <tr><td></td><td><input type='text' id='id_producto' name='id_producto' value='"+public.id_producto+"' class='input1 input_s s_hov'> <input type='text' id='categs' name='categs' value='"+public.nom_producto+"' class='input1 s_hov'>\n </td></tr> \n"+
                    "<tr><td><label for='cantidad'>Cantidad:</label> </td><td><input type='text' id='cantidad' name='cantidad' value='"+public.cantidad+"' class='input1 input_l s_hov' required>\n </td></tr> <tr><td> <label for='precio'>Precio:</label></td><td> <input type='text' id='precio' name='precio' value='"+public.precio+"' class='input1 input_l s_hov'></td></tr>\n "+
                    "<tr><td> <label for='fecha'>Fecha:</label> </td><td> <input type='text' id='fecha' name='fecha' value='"+public.fecha+"' class='input1 input_m' disabled> \n </td></tr> "+
                    "<tr><td style='vertical-align: top'><label for='id_provincia'>Provincia:</label> </td><td> <select id='id_provincia' name='id_provincia' onchange='fill_deptos(this.value, false)' class='select1 s_hov' required> \n", 
                final:" </select><br> \n <table><tr><td valign='top'><input type='text' id='busca_ubic' name='busca_ubic' class='input1 input_s s_hov'> </td> <td><select id='ubicacion' name='ubicacion' size='4' class='select2 s_hov'><option value='0'>Localidades</option></select></td></tr>\n </table>\n </td></tr>\n"+
                    "<tr><td colspan='2'>La publicacion es para vender produccion o requerir servicios?: <br><select id='tipo_publicacion' name='tipo_publicacion' class='select1 s_hov'><option value='0'>Seleccionar</option><option value='V'>Vender produccion</option><option value='C'>Solicitar servicios</option></select><br>La publicacion de solicitud está dirigida a: <br><select id='tipo_agente_publicacion' name='tipo_agente_publicacion' class='select1 s_hov'><option value='0'>Seleccionar</option><option value='P'>Productores</option><option value='R'>Puesteros de Mercados</option><option value='T'>Transportistas</option><option value='Q'>Proveedores</option><option value='U'>Usuarios minoristas</option></select> \n </td></tr> \n"+
                    "<tr><td style='vertical-align: top'> <label for='descripcion'>Descripcion:</label></td><td> <textarea id='descripcion' name='descripcion' class='input_area s_hov'> "+public.descripcion+" </textarea> \n <input type='hidden' id='op' name='op' value='"+p_op+"'><input type='hidden' id='id_publicacion' name='id_publicacion' value='"+public.id+"'> \n\n "+
                    "<input type='hidden' id='id_agente' name='id_agente' value='"+agente.id+"'><input type='hidden' name='fecha_publicacion' value='"+public.fecha+"'><input type='hidden' id='tipo_agente' name='tipo_agente' value='"+agente.tipo+"'> <input type='hidden' id='nom_agente' name='nom_agente' value='"+agente.nombre+"'> \n <input type='hidden' id='ape_agente' name='ape_agente' value='"+agente.apellido+"'> <input type='hidden' id='respa' name='respa' value='"+agente.respa+"'>\n</td></tr>\n"+
                    "<tr><td colspan='2' style='text-align:center; height:60px'> <input type='submit' value='Guardar' class='btn1 s_hov'> </td>"+
                    " \n</tr></table>\n</form>\n<td class='td_form_cols'> </td></tr></table> \n\n"
                };
        }

    

    function get_connection () {

        return mariadb.createConnection({
            host: host_db,
            user: user_db,
            password: pwd_db,
            database: dbase
            });
    }


//.engage (on_app_start, devuelve objeto con las consts de la app que almaceno en app.locals, siempre accesible)
async function asyncDB_engage() {
    const grids_main={header: "<header id='pageHeader'><div class='banner'><table style='table-layout: fixed; width:100%; height:80px;'><tr><td width='10px'></td>"+
            "<td width='60px'><img src='/images/agroweb2_xsmall.png'></td><td></td></tr></table></div><div class='login'>", 
        article: "</header><article id='mainArticle'>", 
        nav:"</article><nav id='mainNav'>", 
        ads:"</nav><div id='siteAds'> <div class='ad_1'>Ad premium</div> <div class='ad_n'>Ad comun1</div><div class='ad_n'>Ad comun2</div><div class='ad_n'>Ad comun3</div>", 
        footer:"</div><footer id='pageFooter'>Footer</footer>"};
    const grids_publics={start: "<div class='grid_main_public'>", 
                        post_nav:" <header_flex id='publicHeaderFlex'>", 
                        post_filter:"</header_flex><article2 id='publicArticle'><div class='grid_publicaciones'>",
                        end: "\n </div></article2></div>"};

    const head="<!DOCTYPE html><html lang='es'>\n<head><title>Briques!</title> \n<meta name='description' content='portal de comercio agropecuario'>\n <link rel='canonical' href='https://www.briques.com.ar'/> \n<meta name='viewport' content='width=device-width'> <link rel='stylesheet' href='/scripts/agroweb.css'> <link rel='icon' type='image/x-icon' href='/images/favicon.ico'> \n  <script src='/scripts/agroweb_scripts.js'></script> ",
      post_body="<header id='pageHeader'><h1>Bienvenidos a Briques!</h1></header><article id='mainArticle'   >",
      nav_bar={home:"<li><a href='/'>Home</a></li>\n", portal:" <li><a href='/portal'>Portal</a></li>\n ", mitablero:""}, 
      pag_error=head+"</head><body><h1>Ha ocurrido un error y estamos trabajando en ello!</h1><br><br><p>",
      f_admins="\n\n<li class='dropdown'> <a href='javascript:void(0)' class='dropbtn'>Funciones</a> <div class='dropdown-content'> <a href='abm?op=np'>Nuevo agente</a> "+
                " <a href='abm?op=nm'>Nuevo mercado</a> <a href='tablero?op=n_gril'>Nueva grilla</a> "+
                "<a href='abm?op=nr'>Nuevos productos</a>  </div>  </li>"+
                "<table class='t_buscador'><tbody> <tr><td class='td_find' style='width:125px'><input type='text' id='busca_agente' class='input_busca'></td> "+
                "<td class='td_find' style='width: 23px;'><a href='javascript:let sa=document.getElementById(\"busca_agente\").value; location=\"/tablero?op=sa&busca_agente=\"+sa+\"\"'> "+
                "<svg width='20px' height='20px' viewBox='0 0 24 24' style='vertical-align:top;'><path d='M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'></path></svg></a>"+
                "</td></tr></tbody></table></ul> ";
    let rta="", opts_provincias="<option value='0'>Seleccionar</option>";
    let vec_provs=[], vec_mercados=[], vec_productos=[], vec_deptos=[];
       try {
           conn=await pool.getConnection();
           let rows = await conn.query("select nombre_provincia, id_provincia from Provincias");
           for (var i in rows) {
               vec_provs[rows[i].id_provincia]=rows[i].nombre_provincia;
               opts_provincias+="<option value='"+rows[i].id_provincia+"'>"+rows[i].nombre_provincia+"</option> ";
               }

            rows = await conn.query("select nombre_mercado, id_mercado, id_ubicacion from Mercados order by nombre_mercado");
            let j=0;
            for (var i in rows) {
                vec_mercados[j++]={id:rows[i].id_mercado, nombre:rows[i].nombre_mercado, ubic:rows[i].id_ubicacion};
                }

            rows = await conn.query("select * from Categorias_producto order by id_categoria");
            let i_faltantes=0;
            
            for (var i in rows) { 
                for (; i_faltantes<rows[i].id_categoria; i_faltantes++) {
                    vec_productos[i_faltantes]={id: null};
                    }
                vec_productos[rows[i].id_categoria]={id: rows[i].id_categoria, nombre_categoria: rows[i].nombre_categoria, categoria0:rows[i].id_categoria0, categoria1:rows[i].id_categoria1, 
                categoria2: rows[i].id_categoria2, categoria3: rows[i].id_categoria3, categoria4:rows[i].id_categoria4, nombre_completo: rows[i].nombre_producto};
                i_faltantes=rows[i].id_categoria+1;
                }
            
            rows = await conn.query("select id_provincia, nombre_ubicacion from Ubicaciones ");
            vec_deptos=[{prov:0, nom:""}];
            j=1;
            for (var i in rows) { 
                vec_deptos[j++]={prov:rows[i].id_provincia, nom:rows[i].nombre_ubicacion};
                }
            console.log("app engaged!");
           } 
       catch (err) {
           console.log(err);
           } 
       finally {
           if (conn)  await conn.release();
           return {engaged: true, vec_provincias: vec_provs, vec_mercados: vec_mercados, vec_deptos: vec_deptos, 
                    vec_productos: vec_productos, opts_provincias: opts_provincias, 
                    consts:{head: head, nav_bar: nav_bar, error: pag_error, f_admins: f_admins, post_body: post_body, 
                            grids_main: grids_main, grids_publics:grids_publics}};
           }
   }


   async function asyncDB_get_vec_deptos(prov) {
    let conn, rta="[";
    try {
    	conn=await pool.getConnection();
   		rows = await conn.query("select id_ubicacion, nombre_ubicacion from Ubicaciones where id_provincia="+prov);
		for (var i in rows) { 
			rta+="["+rows[i].id_ubicacion+", \""+rows[i].nombre_ubicacion+"\"], ";
			}
			rta+="[]]";
			
    } catch (err) {
        console.log(err);
        rta="error!"+err;
    } finally {
        if (conn)  await conn.release();
    	}
 return rta;
 }



 function get_js_productos(prd) { //si viene de un insert, prd.op2 !='' y completo las categs
    let conn, rta="\n <script type='text/javascript'>\n ";
    try {
        if(prd!=null) {
            rta+="\n\n   let state_categs=[false, false, false, false]; \n\n"+
                "function fill_1(){ \n"+ //solo se invoca esta funcion en nuevos pr
                "let dropdown = document.getElementById('select1'); \n "+
                "dropdown.length=0;"+
                " for (let i = 0; i < vec_categs.length; i++) { \n"+
                " if (vec_categs[i].categoria0==null && vec_categs[i].nombre_categoria!=null){ "+
                " dropdown[dropdown.length] = new Option(vec_categs[i].nombre_categoria, vec_categs[i].id);"+
                "} \n  	}\n";
            rta+="dropdown[0].selected=true; \n populating(dropdown[0].value, 2); \n let categs=document.getElementById('categs');\n";
        
            if (prd.op2!='') {
                if (prd.categ1!='null') {
                    rta+="\n let dropdown2 = document.getElementById('select2'); \n populating("+prd.categ1+", 3);\n dropdown2.querySelector('option[value=\""+prd.categ1+"\"]').selected=true; \n ";
                    }
                if (prd.categ2!='null') {
                    rta+="\n let dropdown3 = document.getElementById('select3'); \n populating("+prd.categ2+", 4);\n dropdown3.querySelector('option[value=\""+prd.categ2+"\"]').selected=true; \n "+
                        "categs.value=dropdown3.options[dropdown3.selectedIndex].text; \n";
                    }

                if (prd.categ3!='null') {
                    rta+="\n let dropdown4 = document.getElementById('select4'); \n populating("+prd.categ3+", 5);\n dropdown4.querySelector('option[value=\""+prd.categ3+"\"]').selected=true; \n "+
                        "categs.value+='|'+dropdown4.options[dropdown4.selectedIndex].text; \n";
                    }
                }
            rta+="\n} \n ";
            }

        else {				}

    } catch (err) {
        console.log(err);
        rta="error!"+err;
    } finally {
        return rta+"</script> \n";
    	}
 
 }


   

module.exports={port, pool, get_connection, asyncDB_engage, get_js_productos, get_logout,
                asyncDB_get_vec_deptos, get_links_agente, js_populate, js_deptos, html_form_login, 
                get_form_agente, get_form_mkt, get_form_public, html_new_prd, 
                html_criterios_portal0, html_criterios_portal1, html_form_new_grilla };
