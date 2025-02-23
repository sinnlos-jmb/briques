let set_ubicacion=0, visible=false, vec_nn=[], rta='';

function new_categ(nro_drop) {
 let div_cat = document.getElementById('adding_categs'+nro_drop);
 if (state_categs[nro_drop]) {
 	div_cat.innerHTML='';
 	state_categs[nro_drop]=false;
 	}
 else {
	div_cat.innerHTML="<input type='text' id='new_categ"+nro_drop+"' size='10'/><br> <button onclick='document.location=action_new_categ("+nro_drop+");'> add! </button>";
	document.getElementById('new_categ'+nro_drop).focus();
	state_categs[nro_drop]=true;
	}
 }


function action_new_categ(nro_drop) {
let rta='/abm?op=new_r', top=nro_drop+1;
for (let i=1, j=0; i<=top; j=i, i++) {
 	rta+='&categ'+j+'='+document.getElementById('select'+i).value;
	}
rta+='&nom_prd='+document.getElementById('new_categ'+nro_drop).value+'&categ=';
if(document.getElementById('categs').value!='') { 
	rta+=document.getElementById('categs').value+'|';
	}
rta+=document.getElementById('new_categ'+nro_drop).value;
return rta;
}


function add_grilla () {//id_prd|id_mk|precio
	const select_prd=document.getElementById('results'), 
		select_mk=document.getElementById('select_mk'),
		input_prd=document.getElementById('new_prd'),
		grilla=document.getElementById('pre_grilla'); 
	vec_nn[vec_nn.length]={id_prd:select_prd.value, id_mercado: select_mk.value, precio:input_prd.value};
	grilla.value+=select_prd.value+'|'+select_mk.value+'|'+input_prd.value+'\n';
	}


function set_grilla () {//id_prd|id_mk|precio
	const grilla=document.getElementById('pre_grilla');
	for (let i=0; i<vec_nn.length;i++) {
		grilla+=vec_nn[i].id_prd+'|'+vec_nn[i].id_mercado+'|'+vec_nn[i].precio+'\n';
		}
	}	



function setHiddens(selected) {
	document.getElementById('id_producto').value=selected.value;
	const rta=document.getElementById('categs');
	rta.value='';
	if (selected.id.slice(0,2)!='se') {
		rta.value=selected[document.getElementById('results').selectedIndex].text;
		}
	else {
		let vec_rta=[];
		for (let i=3,j=0; document.getElementById('select'+i)!=null && document.getElementById('select'+i).value>0; i++) {
			vec_rta[j++] = document.getElementById('select'+i).options[document.getElementById('select'+i).selectedIndex].text;
			}
		if (vec_rta.length>0){
			rta.value=vec_rta.join('|');
			}
		}
	}



function fill_0(param){ //busca por categ y llena select (parametrizar con input y select, mas funcion como parámetro

	const ev_select = document.getElementById('results') ;
 	const ev_buscador = document.getElementById('buscador'); 
 	ev_buscador.value='';
	ev_buscador.addEventListener('keyup', event => {  
		ev_select.length=0;
		if (ev_buscador.value.length>2) {
			for (let i=4; i<vec_categs.length; i++) {
				if (vec_categs[i].nombre_completo!=null && vec_categs[i].nombre_completo.includes(ev_buscador.value.toLowerCase())) {
					ev_select[ev_select.length] = new Option(vec_categs[i].nombre_completo, vec_categs[i].id);
					}
				}
			}
		})
	if (param!=null){
		const ev_prov = document.getElementById('id_provincia'), ev_ubic = document.getElementById('ubicacion');
		const ev_tipo_p = document.getElementById('tipo_publicacion'),  ev_tipo_a = document.getElementById('tipo_agente_publicacion');
		//const ev_fecha_p = document.getElementById('fecha_publicacion');//ev_fecha_p.value=param.fecha;
		ev_prov.value=param.prov;
		fill_deptos(param.prov, false)
		ev_ubic.value=param.ubic;
		ev_select[0] = new Option(param.nom_prd, param.id_prd);
		ev_tipo_p.value=param.tipo_publicacion;
		ev_tipo_a.value=param.tipo_agente_p;
		}
 }

 function filtro(key, e) {
	return e.nombre.includes(key);
   }

function fill_mkt(){ //busca mercados por nombre
		const ev_select = document.getElementById('select_mk') ;
		const ev_buscador = document.getElementById('busca_mk'); 
		ev_buscador.value='';
		ev_buscador.addEventListener('keyup', event => { 
			ev_select.length=0;
			if (ev_buscador.value.length>2) {
				vec_nn=vec_mercados.filter(filtro.bind(this, ev_buscador.value));
				for (let i=0; i<vec_nn.length; i++) {
					ev_select[ev_select.length] = new Option(vec_nn[i].nombre, vec_nn[i].id);
					}
				}
			})
		}
	

// seleccionar ubicacion (prov->dpto)
function fetch102 (){
	let vec_deptos=[[]]
	let select = document.getElementById('id_provincia');
	const url = '/api?op=deptos&id_prov='+select.value+'&nom_prov='+select.options[select.selectedIndex].text;
   fetch(url, {
	   headers: {
		   "User-Agent": "My User Agent",
	   },
   })
	   .then((response) => response.json())
	   .then(data => {
		   vec_deptos=data;
		   let dropdown = document.getElementById('ubicacion');
		   dropdown.length =0;
		   for (let i=0; i<vec_deptos.length; i++) {
				dropdown[dropdown.length] = new Option(vec_deptos[i][1], vec_deptos[i][0]);
				if (vec_deptos[i][0]==set_ubicacion) {
					dropdown[dropdown.length-1].selected=true;
					}
				}		   
	   })
   }



function pr_fetch(p_params){ 
		let prov = document.getElementById('id_provincia');
		prov.addEventListener('change', fetch102);
		if (p_params!=null) {
			set_ubicacion=p_params.ubic;
			prov[p_params.prov-1].selected=true;
			fetch102();
			let res = document.getElementById('results');
			res[0] = new Option(p_params.prd_nom, p_params.prd);
			res[0].selected=true;
			}
		}