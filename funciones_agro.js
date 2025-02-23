const lib_c = require("./consts");


 //.inserts
 async function asyncDB_insert(p_sql) {
	const conn = await lib_c.get_connection();
	try {
		 const res = await conn.query(p_sql);
		 return res;
		} 
	finally { conn.release();  }
   }


// recibe objeto con operacion y query. Carga el objeto agente de la sesion, devuelve tabla html.
 async function asyncDB_getAgentes(p_params) {
    let conn, rta="<table>", agente={usuario: null, id: null, tipo: null, 
		nombre: null, apellido: null, respa: null, ubicacion:null};
	
	if (p_params.op=="all") {
		try {
			conn=await lib_c.pool.getConnection();
			const rows = await conn.query(p_params.query);			
			for (var i in rows) {
				agente = {usuario: rows[i].usuario, id: rows[i].id_agente, tipo: rows[i].tipo_agente, ubicacion:rows[i].id_ubicacion_agente, 
								nombre: rows[i].nombre_agente, apellido: rows[i].apellido_agente, respa: rows[i].respa, nacimiento:rows[i].nacimiento, domicilio:rows[i].domicilio_agente};
				rta+="<tr><td><b>"+agente.id+"). <a href='"+lib_c.get_links_agente("tablero?op=ok", agente)+"'>"+ agente.apellido+", "+
				agente.nombre+"</a></b><br>tipo agente: "+agente.tipo+" </td></tr>";
				}
			rta+="<tr><td> <font color='lightgrey'>(A: admin, P: productor, R: puestero, Q: proveedor, U: usuario, T: transportista) </font> </td></tr></table><br>";
			} 
		catch (err) {
			console.log(err);
			rta="error!"+err;
			} 
		finally {
			if (conn)  await conn.release();
			return rta;
			}
		}
	else if (p_params.op=="login") {
			let rta="ok";
			try {
				conn=await lib_c.pool.getConnection();
				const rows = await conn.query(p_params.query);
				for (var i in rows) {
					agente = {usuario: rows[i].usuario, pwd: "secret", 
						id: rows[i].id_agente, tipo: rows[i].tipo_agente, nacimiento:rows[i].nacimiento,
						nombre: rows[i].nombre_agente, apellido: rows[i].apellido_agente, respa: rows[i].respa};
					}
				} 
			catch (err) {
				console.log(err);
				rta="error! "+err;
				} 
			finally {
				if (conn)  await conn.release();
				return {rta:rta, agente:agente};
				}
			}
			else if (p_params.op=="sa") {  //search agente 
				let rta="<table>";
				try {
					conn=await lib_c.pool.getConnection();
					const rows = await conn.query(p_params.query);
					for (var i in rows) {
						agente.id=rows[i].id_agente;
						agente.tipo=rows[i].tipo_agente;
						agente.nombre=rows[i].nombre_agente;
						agente.apellido=rows[i].apellido_agente;
						agente.respa=rows[i].respa;
						agente.ubicacion=rows[i].id_ubicacion_agente;
						rta+="<tr><td>"+agente.id+"</td> <td><a href='"+lib_c.get_links_agente("tablero?op=ok", agente)+"'>"+ agente.nombre+", "+agente.apellido+"</a></td></tr>";
						}
					rta+="\n </table><br>";
					} 
				catch (err) {
					console.log(err);
					rta="error!"+err;
					} 
				finally {
					if (conn)  await conn.release();
					return rta;
					}
				}
   }


 //portal de publicaciones común para todos los tipos de agente se accede a publicaciones según varios filtros
 async function asyncDB_getPortal(params) {
 let is_mkt=false;
 let sql="", conds="", conds_p="", conds_m=""; //condiciones privativas de mercados o de publicaciones

if (params.op=='query') {
		include_order=true;
		if (params.id_prd5!='0') {
			conds+=" and pr.id_categoria="+params.id_prd5;
			}
		else if (params.id_prd4!='0'){
			conds+=" and (pr.id_categoria3="+params.id_prd4+" or pr.id_categoria="+params.id_prd4 +")" ;;
			}
		else if (params.id_prd3!='0'){
			conds+=" and (pr.id_categoria2="+params.id_prd3+" or pr.id_categoria="+params.id_prd3 +")" ;
			}
		else if (params.id_prd2!='0'){
			conds+=" and (pr.id_categoria1="+params.id_prd2+" or pr.id_categoria="+params.id_prd2 +")" ;
			}

		if (params.id_ubic!='0') { conds_p+=" and u.id_ubicacion="+params.id_ubic;	}
		if (params.id_provincia!='0') { conds_p+=" and u.id_provincia="+params.id_provincia;}

		if (params.tipo_agente!='0') { 	conds_p+=" and pa.tipo_agente='"+params.tipo_agente+"'"; }
		if (params.tipo_publicacion!='0') {	conds_p+=" and pa.tipo_publicacion='"+params.tipo_publicacion+"'"; }

		if (params.id_mercado!='0') {
			is_mkt=true;
			sql="SELECT pr.id_categoria , pm.precio_producto precio, pm.fecha_precio, pr.nombre_producto  "+
			" FROM Mercados m , Precios_mercados pm , Categorias_producto pr "+
			" WHERE m.id_mercado ="+params.id_mercado+" and pm.id_mercado =m.id_mercado and pm.id_producto =pr.id_categoria "+ conds+
			" ORDER BY pr.id_categoria , pr.nombre_categoria";
			}
		else {
			sql="SELECT a.nombre_agente, a.id_agente, a.domicilio_agente , u.nombre_ubicacion, pa.id_producto , pr.nombre_producto, pa.cantidad_producto , pa.descripcion_publicacion , pa.fecha_publicacion, pa.precio_producto "+
				" FROM Agentes a, Publicaciones_agente pa , Ubicaciones u , Categorias_producto pr  "+
				" WHERE a.id_agente = pa.id_agente and u.id_ubicacion =pa.id_ubicacion and pa.id_producto = pr.id_categoria "+
				" and estado_publicacion='1' "+ conds+ conds_p+
				" ORDER BY pa.fecha_publicacion";
		}

	}
	else {sql="SELECT a.nombre_agente, a.id_agente, a.domicilio_agente , u.nombre_ubicacion, pa.id_producto , pr.nombre_producto, pa.cantidad_producto , pa.descripcion_publicacion , pa.fecha_publicacion, pa.precio_producto "+
			" FROM Agentes a, Publicaciones_agente pa , Ubicaciones u , Categorias_producto pr  "+
			" WHERE pa.estado_publicacion='1' and a.id_agente = pa.id_agente and u.id_ubicacion =pa.id_ubicacion and pa.id_producto = pr.id_categoria "+
			" ORDER BY pa.fecha_publicacion LIMIT 30";}
 let conn, rta="";
 //console.log("\n SQL portal: \n"+sql);
 try {
	conn=await lib_c.pool.getConnection();
	rows = await conn.query(sql);
	let agente_actual=0, k_agentes=1;
	for (var i in rows) {
		if (is_mkt){
			rta+="<div>"+i+"). "+rows[i].nombre_producto+"<br>";
			rta+="Precio: $"+rows[i].precio;
			rta+="<br>fecha: "+rows[i].fecha_precio+"</div>";
			}

		else { 
			if (agente_actual!=rows[i].id_agente) {
				rta+="<div>"+k_agentes+"). productor-agente: "+rows[i].nombre_agente+"<br>";
				k_agentes++;
				}
			else {
				rta+="<div>";
				}
			rta+=". id agente: "+ rows[i].id_agente +" -- Domicilio: "+rows[i].domicilio_agente+" -- "+rows[i].nombre_ubicacion+"<br>Producto: "+rows[i].nombre_producto+" -- cantidad: "+rows[i].cantidad_producto+"<br>Descripcion: "+rows[i].descripcion_publicacion+"</div>";
			}
	}

   } catch (err) {
	console.log(err);
	rta="error!"+err;
   } finally { if (conn)  await conn.release(); }
 return rta;
 }
 
 
 
  // objeto p_params tiene atributos: op y query
  async function asyncDB_getPublicaciones (p_params) {
    let conn, rta="";
	if (p_params.op=="id") {  //publicaciones de un agente en particular 
		try {
			conn=await lib_c.pool.getConnection();
			const rows = await conn.query(p_params.query);
			let first_expired=true;
			for (var i in rows) {
				if (rows[i].estado_publicacion=='1') {
					rta+="<div> <a href='/abm?op=edit_q&id_publicacion="+rows[i].id_publicacion+"&id_producto="+rows[i].id_producto+"&nom_producto="+rows[i].nombre_producto+"&fecha_publicacion="+rows[i].fecha_publicacion+"&tipo_publicacion="+rows[i].tipo_publicacion+"&tipo_agente_publicacion="+rows[i].tipo_agente+
						"&cantidad="+rows[i].cantidad_producto+"&precio="+rows[i].precio_producto+"&estado="+rows[i].estado_publicacion+"&descripcion="+rows[i].descripcion_publicacion+"&id_agente="+p_params.agente.id+"&nom_agente="+p_params.agente.nombre+"&ape_agente="+p_params.agente.apellido+"&tipo_agente="+
						p_params.agente.tipo+"&respa="+p_params.agente.respa+"&ubicacion="+rows[i].id_ubicacion+"&id_provincia="+rows[i].id_provincia+"'>"+
						rows[i].nombre_producto+"</a>, cantidad: "+rows[i].cantidad_producto+", precio: "+rows[i].precio_producto+", fecha: "+rows[i].fecha_publicacion;
					rta+="<br>descripcion: "+rows[i].descripcion_publicacion+"<br><a href='"+lib_c.get_links_agente("abm?op=estado_q&op2=desactivar&id_publicacion="+rows[i].id_publicacion, p_params.agente)+"'>Desactivar publicacion</a></div>";					 
					}
				else if (rows[i].estado_publicacion=='0') {
					if (first_expired) {
						first_expired=false;
						rta+="</div><br>Publicaciones inactivas: <br> <div class='grid_publicaciones' style='border: 1px solid grey; background: lightgray; border-radius:8px; padding:5px'>";
						}
					rta+="<div class='disabled'>"+rows[i].id_publicacion+"). <a href='/abm?op=edit_q&id_publicacion="+rows[i].id_publicacion+"&id_producto="+rows[i].id_producto+"&nom_producto="+rows[i].nombre_producto+"&fecha_publicacion="+rows[i].fecha_publicacion+"&tipo_publicacion="+rows[i].tipo_publicacion+"&tipo_agente_publicacion="+rows[i].tipo_agente+
						"&cantidad="+rows[i].cantidad_producto+"&precio="+rows[i].precio_producto+"&estado=0&descripcion="+rows[i].descripcion_publicacion+"&id_agente="+p_params.agente.id+"&nom_agente="+p_params.agente.nombre+"&ape_agente="+p_params.agente.apellido+"&tipo_agente="+
						p_params.agente.tipo+"&respa="+p_params.agente.respa+"&ubicacion="+rows[i].id_ubicacion+"&id_provincia="+rows[i].id_provincia+"'>"+
						rows[i].nombre_producto+"</a>, cantidad: "+rows[i].cantidad_producto+", precio: "+rows[i].precio_producto+", fecha: "+rows[i].fecha_publicacion;
					rta+="<br>descripcion: "+rows[i].descripcion_publicacion+
						"<br><a href='"+lib_c.get_links_agente("abm?op=estado_q&op2=reactivar&id_publicacion="+rows[i].id_publicacion, p_params.agente)+"'>Reactivar publicacion</a>"+						
						"<br><a href='"+lib_c.get_links_agente("abm?op=estado_q&op2=eliminar&id_publicacion="+rows[i].id_publicacion, p_params.agente)+"'>Eliminar publicacion</a></div>";						

				}
				}
			} 
		catch (err) {
			console.log(err);
			rta="error!"+err;
			} 
		finally { if (conn)  await conn.release(); }
		}
	return rta;
 }





 module.exports = { asyncDB_getAgentes,  asyncDB_insert, asyncDB_getPortal, asyncDB_getPublicaciones };
