const app = require('express')();
const functions = require('firebase-functions');
var serviceAccount = require('./chave/engfooddeliverytestes.json');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const admin = require('firebase-admin');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://engfooddeliverytestes.firebaseio.com"
});

var fetch = require('node-fetch'); //Notificações expo

const moment = require('moment');

const bd = 'menuengfood';
const root = 'menuroot'//'rootmenu';
const senha =  'Men2505'//'@Men2505';   //Uolhost Cloud Computer Server 1 Men2505
const host = '200.98.143.198'//'menuengfood.mysql.uhserver.com';

const Sequelize = require('sequelize');
const sequelize = new Sequelize(bd, root, senha, {
	host: host,
	dialect: 'mysql'
});

const timezonepadrao = 3;

//  ExponentPushToken[temF1VNvUXSCLEh5Jxoc_x]  ios
//  ExponentPushToken[r7tR2GApAL4odheyhjUu1p] android



exports.appteste = functions.https.onRequest(async (request, response) => {

	const messagepush = {
		to: ['ExponentPushToken[r7tR2GApAL4odheyhjUu1p]'],
		sound: 'default',
		title: 'Title  test',
		body: 'Body test!',
		data: { data: 'data test.' },
		android: {
			icon: '../assets/icone.png',

		},
		notification: {
			"icon": "../assets/icone.png",
			"color": "#4f4f",
			"iosDisplayInForeground": false
		},
		_displayInForeground: true,
	};
	await fetch('https://exp.host/--/api/v2/push/send', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Accept-encoding': 'gzip, deflate',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(messagepush),
	});

	response.status(200).send({});
})



app.get("/appgetloja", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		console.log('uid', uid);
		await admin.auth().getUser(uid);
		console.log('Auth', 'successs');
		var path = request.query.path;
		var token = request.query.token;
		var r = await authRest(token, path);
		console.log('r', r);
		if (r == 1) {
			var rows = await sequelize.query("SELECT * FROM apploja where path like ? and lojaativa like 1",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})
			if (rows.length > 0) {
				data = rows[0];

				var rowsinfo = await sequelize.query("SELECT * FROM appinformacoes where path like ?",
					{
						replacements: [path],
						type: sequelize.QueryTypes.SELECT
					})
				data.informacoes = rowsinfo[0]

				data.funcionamento = await sequelize.query("SELECT * FROM appfuncionamento where path like ?",
					{
						replacements: [path],
						type: sequelize.QueryTypes.SELECT
					})

				var rowsmenuengfood = await sequelize.query("SELECT * FROM appmenuengfood where path like ?",
					{
						replacements: [path],
						type: sequelize.QueryTypes.SELECT
					})
				data.menuengfood = rowsmenuengfood[0]

				var rowsengpoints = await sequelize.query("SELECT * FROM appengpointsconfig where path like ?",
					{
						replacements: [path],
						type: sequelize.QueryTypes.SELECT
					})
				data.engpoints = rowsengpoints[0]

				response.status(200).send(data);
			} else {
				response.status(200).send({
					informacoes: {
						Fantasia: "Nenhum app encontrado",

					}
				});
			}

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.get("/appgetfranquia", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		var path = request.query.path;

		var loja = undefined;
		data = await sequelize.query("SELECT * FROM appfranquias where franquia like ? and ativa  = 1",
			{
				replacements: [path],
				type: sequelize.QueryTypes.SELECT
			})

		if (data.length > 0) {
			loja = data[0]
			loja.lojas = await sequelize.query("SELECT * FROM appfranquiaslojas where ativa = 1 and appfranquiasid = ?",
				{
					replacements: [loja.idappfranquias],
					type: sequelize.QueryTypes.SELECT
				})
		}

		response.status(200).send(loja);


	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})





app.post("/appupdateinformacoes",async (request, response) => {
	try {
			var uid = request.query.uid;
			await admin.auth().getUser(uid);
			var path = request.query.path;
			var token = request.query.token;
			let info = request.body;
			var r = await authRest(token, path);
			if (r === 1) {
				const resultTransaction = await sequelize.transaction(async (trans) => {
					if (info !== undefined) {
						await sequelize.query("UPDATE `appinformacoes` SET Bairro = ?,`Cidade` = ?,`Endereco` = ?,`Estado` = ?,`Fantasia` = ?,"
							.concat("`Telefone` = ?,`exibirEndereco` = ?,  `minimo` = ?,`retirarLocal` = ?,`tempo1` = ? WHERE `path` = ?"),
							{
								replacements: [info.Bairro, info.Cidade, info.Endereco, info.Estado, info.Fantasia, info.Telefone, info.exibirEndereco,
								info.minimo, info.retirarLocal, info.tempo1, path],
								type: sequelize.QueryTypes.INSERT,
								transaction: trans
							})
					}
				})
				response.status(200).send(info);
			} else {
				response.status(400).send({
					status: 'erro',
					data: erro,
					message: 'Erro de autenticação!'
				});			
		}
	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})





app.get("/appgetconfig", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var r = await authRest(token, path);
		if (r == 1) {
			data = await sequelize.query("SELECT * FROM appinformacoes where path like ?",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})

			response.status(200).send(data[0]);

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.get("/appgethistoricofidelidade",async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var uidcli = request.query.uidcli;
		var r = await authRest(token, path);
		if (r == 1) {
			data.historico = await sequelize.query("SELECT * FROM fidelidade where path like ? and uid like ? order by data desc limit 100",
				{
					replacements: [path, uidcli],
					type: sequelize.QueryTypes.SELECT
				})

			response.status(200).send(data);


		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.get("/appgetclientes",async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var r = await authRest(token, path);
		if (r == 1) {
			data = await sequelize.query("select usuarios.* from ((SELECT pedidousuarios.* FROM pedidousuarios "
				.concat("inner join pedido on pedidousuarios.pedidoid = pedido.pedid ",
					"where path like ? group by pedidousuarios.uid) as tb) inner join usuarios on tb.uid = usuarios.uid"),
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})

			response.status(200).send(data);


		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.post("/appupdateprogramadefidelidade", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let engpoints = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				if (engpoints !== undefined) {
					await sequelize.query("UPDATE `appengpointsconfig` SET `ativo` = ?,`desconto` = ?,`nome` = ?, `pontos` = ?, `porInvite` = ? WHERE `path` = ?",
						{
							replacements: [engpoints.ativo, engpoints.desconto, engpoints.nome, engpoints.pontos, engpoints.porInvite, path],
							type: sequelize.QueryTypes.INSERT,
							transaction: trans
						})
				}
			})
			response.status(200).send(engpoints);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}
	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.get("/appgetprogramadefidelidade", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var r = await authRest(token, path);
		if (r == 1) {
			data = await sequelize.query("SELECT * FROM appengpointsconfig where path like ?",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})
			if (data.length > 0)
				response.status(200).send(data[0]);
			else {
				data.ativo = 0
				data.nome = "Engpoints";
				response.status(200).send(data);
			}

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.get("/appgetbandeiras", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var r = await authRest(token, path);
		if (r == 1) {
			data = await sequelize.query("SELECT * FROM appformas_pagamento where path like ? order by Situacao desc, ordem",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})
			response.status(200).send(data);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})



app.post("/appupdatebandeiras", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let bandeiras = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				var sql = "delete from appformas_pagamento where path like ?";
				await sequelize.query(sql,
					{
						replacements: [path],
						type: sequelize.QueryTypes.DELETE,
						transaction: trans
					})

				if (bandeiras !== undefined) {

					for (const ban of bandeiras) {
						await sequelize.query("INSERT INTO `appformas_pagamento` (`chave`, `path`,`Situacao`,`Url`,`bandeira`,`ordem`) VALUES (?,?,?,?,?,?)",
							{
								replacements: [ban.chave, path, ban.Situacao, ban.Url, ban.bandeira, ban.ordem],
								type: sequelize.QueryTypes.INSERT,
								transaction: trans
							})
					}
				}
			})
			response.status(200).send(bandeiras);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}

	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})





app.get("appgetturnos", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var r = await authRest(token, path);
		if (r == 1) {
			data = await sequelize.query("SELECT * FROM appfuncionamento where path like 'engtec' order by dia",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})
			response.status(200).send(data);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})



app.post("/appupdatefuncionamento", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let funcionamento = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				var sql = "UPDATE `appfuncionamento` SET  `hora1` = ?, `hora2` = ?,`hora3` = ?,`hora4` = ?,`turnos` = ? WHERE `id` = ?";
				if (funcionamento !== undefined) {
					for (const func of funcionamento) {
						await sequelize.query(sql,
							{
								replacements: [func.hora1, func.hora2, func.hora3, func.hora4, func.turnos, func.id],
								type: sequelize.QueryTypes.UPDATE,
								transaction: trans
							})
					}
				}
			})
			response.status(200).send(func);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}

	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})






app.post("/appupdatetaxasdelivery", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let bairros = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				var sql = "delete from appbairros where path like ?";
				await sequelize.query(sql,
					{
						replacements: [path],
						type: sequelize.QueryTypes.DELETE,
						transaction: trans
					})

				if (bairros !== undefined) {
					for (const bairro of bairros) {
						await sequelize.query("INSERT INTO `appbairros` (`atendido`,`chave`,`descricao`,`valor`,`path`) VALUES (?,?,?,?,?)",
							{
								replacements: [bairro.atendido, bairro.chave, bairro.descricao, bairro.valor, path],
								type: sequelize.QueryTypes.INSERT,
								transaction: trans
							})
					}
				}
			})
			response.status(200).send(bairros);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}
	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.get("/appgetbairros", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var r = await authRest(token, path);
		if (r == 1) {
			data = await sequelize.query("SELECT * FROM menuengfood.appbairros where path like 'engtec' order by atendido desc, descricao",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})
			response.status(200).send(data);

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




app.post("/appdeleteproduto", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let prod = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				var sql = "delete from appprodutos where idappprodutos = ?";
				const resul = await sequelize.query(sql,
					{
						replacements: [prod.idappprodutos],
						type: sequelize.QueryTypes.DELETE,
						transaction: trans
					})

				if (prod.grupos !== undefined) {
					for (const grupo of prod.grupos) {
						await sequelize.query("delete FROM appgrupoitens where idgrupo = ?",
							{
								replacements: [grupo.idappgrupos],
								type: sequelize.QueryTypes.DELETE,
								transaction: trans
							})
					}

					await sequelize.query("delete FROM appgrupos where appprodutoid = ?",
						{
							replacements: [prod.idappprodutos],
							type: sequelize.QueryTypes.DELETE,
							transaction: trans
						})
				}
			})
			response.status(200).send(prod);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}

	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})







app.post("/appupdateproduto", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let prod = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				var sql = "UPDATE appprodutos SET Disponivel = ?, Info = ?, NomeReduzido = ?, Venda = ?, indispdom = ?,"
					.concat("indispqua = ?,indispqui = ?,indispsab = ?,indispseg = ?,indispsex = ?,indispter = ?,ordem = ?,",
						"AtivarPromocao = ?,ValorPromocao = ?,`path` = ?,Url = ? WHERE idappprodutos = ?");
				const resul = await sequelize.query(sql,
					{
						replacements: [prod.Disponivel, prod.info, prod.NomeReduzido, prod.Venda, prod.indispdom, prod.indispqua, prod.indispqui,
						prod.indispsab, prod.indispseg, prod.indispsex, prod.indispter, prod.ordem, prod.AtivarPromocao, prod.ValorPromocao,
							path, prod.Url, prod.idappprodutos],
						type: sequelize.QueryTypes.UPDATE,
						transaction: trans
					})

				var grupos = await sequelize.query("SELECT * FROM appgrupos where appprodutoid = ? ",
					{
						replacements: [prod.idappprodutos],
						type: sequelize.QueryTypes.SELECT,
						transaction: trans
					})

				if (grupos !== undefined) {
					for (const grupo of grupos) {
						await sequelize.query("delete FROM appgrupoitens where idgrupo = ?",
							{
								replacements: [grupo.idappgrupos],
								type: sequelize.QueryTypes.DELETE,
								transaction: trans
							})
					}

					await sequelize.query("delete FROM appgrupos where appprodutoid = ?",
						{
							replacements: [prod.idappprodutos],
							type: sequelize.QueryTypes.DELETE,
							transaction: trans
						})
				}


				// continua atualizacao
				if (prod.grupos !== undefined) {
					var query = "";
					for (const grupo of prod.grupos) {
						query = "INSERT INTO `appgrupos`(`chave`,`descricao`,`maximo`,`minimo`,`obrigatorio`,`ordem`,`pausado`,`produtoid`,`selected`,`appprodutoid`, path) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
						await sequelize.query(query, {
							replacements: [grupo.chave, grupo.descricao, grupo.maximo, grupo.minimo, grupo.obrigatorio,
							grupo.ordem, grupo.pausado, grupo.produtoid, 0, prod.idappprodutos, path],
							type: sequelize.QueryTypes.INSERT,
							transaction: trans
						})
						var gr = await sequelize.query('SELECT LAST_INSERT_ID() as idappgrupos', {
							type: sequelize.QueryTypes.SELECT,
							transaction: trans
						})
						grupo.idappgrupos = gr[0].idappgrupos;

						if (grupo.itens !== undefined) {
							query = "INSERT INTO `appgrupoitens` (`chave`,`disponivel`,`grobalvalor`,`idgrupo`,`info`,`nome`,`ordem`,`produtoid`,`selected`,`valor`,`valornew`, path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";

							for (const gitem of grupo.itens) {
								await sequelize.query(query, {
									replacements: [gitem.chave, gitem.disponivel, gitem.grobalvalor, grupo.idappgrupos,
									gitem.info, gitem.nome, gitem.ordem, gitem.produtoid, 0, gitem.valor, gitem.valornew, path],
									type: sequelize.QueryTypes.INSERT,
									transaction: trans
								})
							}
						}
					}
				}

			})
			response.status(200).send(prod);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}

	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})



//updatefastproduto
app.post("/appupdatefastproduto", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let prod = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				var sql = "UPDATE `appprodutos` SET `Disponivel` = ?,`ordem` = ?, `Venda` = ? WHERE `idappprodutos` = ?";
				var param = [prod.Disponivel, prod.ordem, prod.Venda, prod.idappprodutos]
				if (prod.tamanhoid > 0) {
					sql = "UPDATE `appprodutos` SET `Disponivel` = ?,`ordem` = ? WHERE `idappprodutos` = ?";
					param = [prod.Disponivel, prod.ordem, prod.idappprodutos]
				}
				const resul = await sequelize.query(sql,
					{
						replacements: param,
						type: sequelize.QueryTypes.UPDATE,
						transaction: trans
					})
			})
			response.status(200).send(prod);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}
	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




//cadastra a produto da loja
app.post("/appinsertproduto", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let prod = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				const resul = await sequelize.query("INSERT INTO `appprodutos`(`CalcularComplenetos`,`Categoria`,`Disponivel`,`Info`,`NomeReduzido`,`ProdutoID`,"
					.concat("Tipo,`Unidade`,`Venda`,`indispdom`,`indispqua`,`indispqui`,`indispsab`,`indispseg`,`indispsex`,`indispter`,",
						"`ordem`,`tamanhoid`,`valorUnitarioFinal`,`tamanho`,`appcategoriaid`,`AtivarPromocao`,`ValorPromocao`, path, Url) VALUES (?,?,?,?,?,?,?,?",
						",?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"),
					{
						replacements: [prod.CalcularComplenetos, prod.Categoria, prod.Disponivel, prod.Info, prod.NomeReduzido, prod.ProdutoID,
						prod.Tipo, prod.Unidade, prod.Venda, prod.indispdom, prod.indispqua, prod.indispqui, prod.indispsab,
						prod.indispseg, prod.indispsex, prod.indispter, prod.ordem, prod.tamanhoid, prod.Venda, 0,
						prod.appcategoriaid, prod.AtivarPromocao, prod.ValorPromocao, path, prod.Url],
						type: sequelize.QueryTypes.INSERT,
						transaction: trans
					})

				const rs = await sequelize.query('SELECT LAST_INSERT_ID() as idappprodutos', {
					type: sequelize.QueryTypes.SELECT,
					transaction: trans
				})
				prod.idappprodutos = rs[0].idappprodutos;

				if (prod.grupos !== undefined) {
					var query = "";
					for (const grupo of prod.grupos) {
						query = "INSERT INTO `appgrupos`(`chave`,`descricao`,`maximo`,`minimo`,`obrigatorio`,`ordem`,`pausado`,`produtoid`,`selected`,`appprodutoid`, path) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
						await sequelize.query(query, {
							replacements: [grupo.chave, grupo.descricao, grupo.maximo, grupo.minimo, grupo.obrigatorio,
							grupo.ordem, grupo.pausado, grupo.produtoid, 0, prod.idappprodutos, path],
							type: sequelize.QueryTypes.INSERT,
							transaction: trans
						})
						var gr = await sequelize.query('SELECT LAST_INSERT_ID() as idappgrupos', {
							type: sequelize.QueryTypes.SELECT,
							transaction: trans
						})
						grupo.idappgrupos = gr[0].idappgrupos;

						if (grupo.itens !== undefined) {
							query = "INSERT INTO `appgrupoitens` (`chave`,`disponivel`,`grobalvalor`,`idgrupo`,`info`,`nome`,`ordem`,`produtoid`,`selected`,`valor`,`valornew`, path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";

							for (const gitem of grupo.itens) {
								await sequelize.query(query, {
									replacements: [gitem.chave, gitem.disponivel, gitem.grobalvalor, grupo.idappgrupos,
									gitem.info, gitem.nome, gitem.ordem, gitem.produtoid, 0, gitem.valor, gitem.valornew, path],
									type: sequelize.QueryTypes.INSERT,
									transaction: trans
								})
							}
						}
					}
				}
			})
			response.status(200).send(prod);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}
	} catch (erro) {
		console.log('Erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




//Retorna os produtos restfull da loja
app.get("/appgetprodutos", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		var catDescricao = request.query.catDescricao

		console.log('catDescricao', catDescricao)

		var r = await authRest(token, path);

		if (r == 1) {

			var query = "SELECT appprodutos.*, appcategorias.catDescricao "
				.concat("FROM appprodutos left join appcategorias on ",
					"appprodutos.appcategoriaid = appcategorias.idcategorias where appprodutos.path like ? and appcategorias.path like ?  ");
			//and appprodutos.Tipo = appcategorias.tipo
			if (catDescricao !== undefined && catDescricao !== '')
				query = query.concat("and catDescricao like ?")

			query = query.concat(" order by appcategorias.catDescricao, appprodutos.ordem");

			var prods = await sequelize.query(query,
				{
					replacements: [path, path, catDescricao],
					type: sequelize.QueryTypes.SELECT
				})

			if (prods !== undefined) {
				for (const prod of prods) {
					prod.grupos = await sequelize.query("SELECT * FROM appgrupos where appprodutoid = ? order by ordem",
						{ replacements: [prod.idappprodutos], type: sequelize.QueryTypes.SELECT })

					if (prod.grupos !== undefined) {
						for (const grupo of prod.grupos) {
							grupo.itens = await sequelize.query("SELECT * FROM appgrupoitens where idgrupo = ? order by ordem",
								{ replacements: [grupo.idappgrupos], type: sequelize.QueryTypes.SELECT })
						}
					}

				}
			}
			response.status(200).send(prods);

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})




//cadastra a categoria da loja
app.post("/appinsertcategorias", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let cat = request.body;
		console.log('CAT', cat);
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				const resul = await sequelize.query("INSERT INTO appcategorias (path, Ativa, catChave, catDescricao, ordem, tipo, hora1, hora2, limitarHora)"
					.concat(" VALUES (?,?,?,?,?,?,?,?,?)"),
					{
						replacements: [path, cat.Ativa, cat.catChave, cat.catDescricao, cat.ordem, cat.tipo, cat.hora1, cat.hora2, cat.limitarHora],
						type: sequelize.QueryTypes.INSERT,
						transaction: trans
					})
			})
			response.status(200).send(cat);
		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})





//delete a categoria da loja
app.post("/appdeletecategorias", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let cat = request.body;
		console.log('CAT', cat);
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				const [results, metadata] = await sequelize.query('DELETE FROM `appcategorias` WHERE idcategorias = ?',
					{
						replacements: [cat.idcategorias],
						type: sequelize.QueryTypes.UPDATE,
						transaction: trans
					})
			})

			response.status(200).send(cat);

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})



//atualiza a categoria da loja
app.post("/appupdatecategorias", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;
		let cat = request.body;
		var r = await authRest(token, path);
		if (r === 1) {
			const resultTransaction = await sequelize.transaction(async (trans) => {
				const [results, metadata] = await sequelize.query('UPDATE appcategorias SET Ativa = ?, catDescricao = ?, ordem = ?, hora1 = ?, hora2 = ?,limitarHora = ? WHERE idcategorias = ?',
					{
						replacements: [cat.Ativa, cat.catDescricao, cat.ordem, cat.hora1, cat.hora2, cat.limitarHora, cat.idcategorias],
						type: sequelize.QueryTypes.UPDATE,
						transaction: trans
					})
			})

			response.status(200).send(cat);

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de autenticação!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})



//Retorna todas as categorias da loja
app.get("/appgetcategorias", async (request, response) => {
	try {
		var data = {
			status: 'success',
			data: [],
			message: ''
		}
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var path = request.query.path;
		var token = request.query.token;

		var r = await authRest(token, path);


		if (r == 1) {
			data = await sequelize.query("SELECT * FROM appcategorias where path like ? order by ordem",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})
			response.status(200).send(data);

		} else {
			response.status(400).send({
				status: 'erro',
				data: erro,
				message: 'Erro de servidor!'
			});
		}
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})





app.post("/ordercanceled", async (request, response) => {
	try {
		let order = request.body;
		var auth = await admin.auth().getUser(order.uid);

		const resultTransaction = await sequelize.transaction(async (trans) => {

			var rfuso = await sequelize.query("SELECT DATE_ADD(now(), INTERVAL diffuso hour) as hora, diffuso as fuso FROM apploja where path like ?",
				{
					replacements: [order.path],
					type: sequelize.QueryTypes.SELECT,
					transaction: trans
				})
			var fuso = rfuso[0].fuso;

			const [results, metadata] = await sequelize.query('update pedido set `status` = ?, motivocancelamento = ? where pedid = ? and `status` = 0 and uid = ?',
				{
					replacements: [2, order.motivoCancelamento, order.pedid, order.uid],
					type: sequelize.QueryTypes.UPDATE,
					transaction: trans
				})

			//INSERIR PEDIDO TIMELINE				

			await sequelize.query("INSERT INTO pedidotimeline (`time`,`title`,`description`,`path`, pedid, `status`) VALUES ( DATE_FORMAT( DATE_ADD(now(), INTERVAL ? hour), '%H:%i'),?,?,?,?,?)",
				{
					replacements: [fuso, "Pedido cancelado", "O estabelecimento não confirmou seu pedido a tempo e ele foi cancelado.", order.path, order.pedid, 2],
					type: sequelize.QueryTypes.INSERT,
					transaction: trans
				})


			if (order.pedid > 0) {

				await admin.database().ref()
					.child(order.path)
					.child('orders')
					.child(order.uid)
					.child(order.key)
					.child('status')
					.set(4);

				const messagepush = {
					to: order.usuario.token,
					sound: 'default',
					title: 'Pedido foi cancelado',
					body: 'O seu pedido '.concat(order.pedid.toString(), ' foi cancelado! ', order.motivoCancelamento),
					data: { data: 'O pedido escontra-se em produção no momento.' },
					_displayInForeground: true,
				};
				await fetch('https://exp.host/--/api/v2/push/send', {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Accept-encoding': 'gzip, deflate',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(messagepush),
				});
			}
		})

		response.status(200).send(order);

	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})





app.post("/orderdelivered", async (request, response) => {
	try {
		let order = request.body;
		var auth = await admin.auth().getUser(order.uid);

		const resultTransaction = await sequelize.transaction(async (trans) => {

			var rfuso = await sequelize.query("SELECT DATE_ADD(now(), INTERVAL diffuso hour) as hora, diffuso as fuso FROM apploja where path like ?",
				{
					replacements: [order.path],
					type: sequelize.QueryTypes.SELECT,
					transaction: trans
				})
			var fuso = rfuso[0].fuso;

			const [results, metadata] = await sequelize.query('update pedido set `status` = ? where pedid = ? and `status` = 0 and uid = ?',
				{
					replacements: [4, order.pedid, order.uid],
					type: sequelize.QueryTypes.UPDATE,
					transaction: trans
				})

			//INSERIR PEDIDO TIMELINE				

			await sequelize.query("INSERT INTO pedidotimeline (`time`,`title`,`description`,`path`, pedid, `status`) VALUES ( DATE_FORMAT( DATE_ADD(now(), INTERVAL ? hour), '%H:%i'),?,?,?,?,?)",
				{
					replacements: [fuso, "Saiu para entrega", "Seu pedido está vindo até você.", order.path, order.pedid, 4],
					type: sequelize.QueryTypes.INSERT,
					transaction: trans
				})


			if (order.pedid > 0) {

				await admin.database().ref()
					.child(order.path)
					.child('orders')
					.child(order.uid)
					.child(order.key)
					.child('status')
					.set(4);

				const messagepush = {
					to: order.usuario.token,
					sound: 'default',
					title: 'Pedido saiu para entrega',
					body: 'O seu pedido '.concat(order.pedid.toString(), ' está a seu caminho!'),
					data: { data: 'O pedido escontra-se em produção no momento.' },
					_displayInForeground: true,
				};
				await fetch('https://exp.host/--/api/v2/push/send', {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Accept-encoding': 'gzip, deflate',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(messagepush),
				});
			}
		})
		response.status(200).send(order);

	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})

app.post("/confirmorder", async (request, response) => {
	try {
		var url = '';
		let order = request.body;
		var auth = await admin.auth().getUser(order.uid);

		const resultTransaction = await sequelize.transaction(async (trans) => {

			var rfide = await sequelize.query("SELECT * FROM appengpointsconfig where path like ? ",
				{
					replacements: [order.path],
					type: sequelize.QueryTypes.SELECT,
					transaction: trans
				})
			const configengpoints = rfide[0];

			var rfuso = await sequelize.query("SELECT DATE_ADD(now(), INTERVAL diffuso hour) as hora, diffuso as fuso, appmenuengfood.url FROM apploja left join appmenuengfood on apploja.path = appmenuengfood.path where apploja.path like ?",
				{
					replacements: [order.path],
					type: sequelize.QueryTypes.SELECT,
					transaction: trans
				})
			var fuso = rfuso[0].fuso;
			url = rfuso[0].url;

			const [results, metadata] = await sequelize.query('update pedido set `status` = ? where pedid = ? and `status` = 0 and uid = ?',
				{
					replacements: [1, order.pedid, order.uid],
					type: sequelize.QueryTypes.UPDATE,
					transaction: trans
				})

			//INSERIR PEDIDO TIMELINE							
			await sequelize.query("INSERT INTO `pedidotimeline` (`time`,`title`,`description`,`path`,`pedid`, `status`) VALUES (DATE_FORMAT( DATE_ADD(now(), INTERVAL ? hour), '%H:%i'),?,?,?,?,?)",
				{
					replacements: [fuso, "Pedido confirmado", "O estabelecimento já está preparando o pedido.", order.path, order.pedid, 1],
					type: sequelize.QueryTypes.INSERT,
					transaction: trans
				})


			if (configengpoints !== undefined) {
				if (configengpoints.ativo === 1) {

					var saldoP = 0;
					var rsfidel0 = await sequelize.query("SELECT saldo FROM fidelidade where uid like ? order by id desc limit 1 ",
						{
							replacements: [order.uid],
							type: sequelize.QueryTypes.SELECT
						})
					console.log("rsfidel0", rsfidel0)
					if (rsfidel0.length > 0)
						saldoP = rsfidel0[0].saldo
					saldoP = saldoP + (order.valor - order.taxa);

					sql = "INSERT INTO fidelidade (uid,path,data,pedidoid,pontos,saldo,descricao,byinvited) "
						.concat("VALUES (?,?,DATE_ADD(now(), INTERVAL ? hour),?,?,?,?,?)");
					await sequelize.query(sql,
						{
							replacements: [order.uid, order.path, fuso, order.pedid, order.valor, saldoP, "Pts acumulados, pedido nº ".concat(order.pedid.toString()), 0],
							type: sequelize.QueryTypes.INSERT,
							transaction: trans
						})

					var rsfidel = await sequelize.query("SELECT us1.inviteCode, us1.id, us1.uid, us2.invitedcode, us1.displayName from usuarios as us1 inner join usuarios as us2 on us1.inviteCode = us2.invitedcode and us2.uid like ? and us2.invitedcode <> ''",
						{
							replacements: [order.uid],
							type: sequelize.QueryTypes.SELECT
						})


					if (rsfidel.length > 0) {
						var uidinvited = rsfidel[0].uid
						rsfidel[0].displayName


						saldoP = 0;
						var rsfidel2 = await sequelize.query("SELECT saldo FROM fidelidade where uid like ? order by id desc limit 1 ",
							{
								replacements: [uidinvited],
								type: sequelize.QueryTypes.SELECT
							})


						if (rsfidel2.length > 0)
							saldoP = rsfidel2[0].saldo
						var pontos = (order.valor - order.taxa) * configengpoints.porInvite / 100
						saldoP = saldoP + pontos;

						sql = "INSERT INTO fidelidade (uid,path,data,pedidoid,	pontos,saldo,descricao,byinvited) "
							.concat("VALUES (?,?,DATE_ADD(now(), INTERVAL ? hour),?,?,?,?,?)");
						await sequelize.query(sql,
							{
								replacements: [uidinvited, order.path, fuso, order.pedid, pontos, saldoP, '[ '.concat(rsfidel[0].displayName,
									" ] : Pontos por invite "), 1],
								type: sequelize.QueryTypes.INSERT,
								transaction: trans
							})

					}
				}
			}
		})

		if (order.pedid > 0) {

			await admin.database().ref()
				.child(order.path)
				.child('orders')
				.child(order.uid)
				.child(order.key)
				.child('status')
				.set(1)

			const messagepush = {
				to: order.usuario.token,
				sound: 'default',
				title: 'Pedido confirmado',
				body: 'O seu pedido '.concat(order.pedid.toString(), ' foi confirmado pelo restaurante!'),
				data: { data: 'O pedido escontra-se em produção no momento.' },
				icon: url,
				_displayInForeground: true,
			};
			await fetch('https://exp.host/--/api/v2/push/send', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Accept-encoding': 'gzip, deflate',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(messagepush),
			});
		}
		response.status(200).send(order);

	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'Erro de servidor!'
		});
	}
})

app.post("/acknowledgment", async (request, response) => {
	try {
		let posts = request.body;

		console.log('acknowledgment', posts)

		if (posts.length > 0) {
			var auth = await admin.auth().getUser(posts[0].uid);
			var sql = "UPDATE pedido SET code = ? WHERE pedid= ?";
			for (const item of posts) {
				await sequelize.query(sql,
					{
						replacements: ['INTEGRATED', item.id],
						type: sequelize.QueryTypes.UPDATE
					})
			}
		}

	} catch (erro) {
		console.log('erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro,
			message: 'erro de processamento'
		});
	}
})

app.get("/getorders", async (request, response) => {
	try {
		var uid = request.query.uid
		var path = request.query.path
		var auth = await admin.auth().getUser(uid);
		var result = await sequelize.query("SELECT * FROM pedido where path like ? and code like ? and pedido.status = 0 and dataserver > DATE_ADD(current_timestamp(), INTERVAL -2 hour) ",
			{
				replacements: [path, 'PLACED'],
				type: sequelize.QueryTypes.SELECT
			})

		response.status(200).send(result);

	} catch (erro) {
		console.log('erro', erro)
		response.status(400).send({
			status: 'erro',
			data: erro
		});
	}
})

app.get("/getorder", async (request, response) => {
	try {
		var uid = request.query.uid
		var pedid = request.query.pedid
		var auth = await admin.auth().getUser(uid);

		var result = await sequelize.query("SELECT * FROM pedido where pedid = ?",
			{
				replacements: [pedid],
				type: sequelize.QueryTypes.SELECT
			})


		if (result.length > 0) {
			var pedido = result[0];

			pedido.itens = await sequelize.query("SELECT * FROM pedidoitens where pedid = ?",
				{
					replacements: [pedid],
					type: sequelize.QueryTypes.SELECT
				})
			pedido.produtos = pedido.itens;

			for (const item of pedido.itens) {
				item.complementos = await sequelize.query("SELECT * FROM pedidoitenscomplementos where pedidoitensid = ?",
					{
						replacements: [item.idpedidoitens],
						type: sequelize.QueryTypes.SELECT
					})
			}

			//RETORNA USUARIO
			var resultuser = await sequelize.query("SELECT * FROM pedidousuarios where pedidoid = ?",
				{
					replacements: [pedid],
					type: sequelize.QueryTypes.SELECT
				})
			if (resultuser.length > 0)
				pedido.usuario = resultuser[0]


			//Retorna os cupons
			var query = "SELECT engcupons.* FROM engcuponsvalidados inner join engcupons on engcuponsvalidados.cupid = "
				.concat("engcupons.idengcupons where engcuponsvalidados.pedid = ?")
			var cupons = await sequelize.query(query,
				{
					replacements: [pedid],
					type: sequelize.QueryTypes.SELECT
				})

			if (cupons.length > 0)
				pedido.cupom = cupons[0]
			//Fim dos cupons

			//Retorna o fidelidade
			var query = "SELECT * from fidelidadevalidado where pedid = ?"
			var fidelidades = await sequelize.query(query,
				{
					replacements: [pedid],
					type: sequelize.QueryTypes.SELECT
				})

			if (fidelidades.length > 0)
				pedido.fidelidade = fidelidades[0]
			//Fim dos fidelidade


			//PAGAMENTO
			pedido.payments = await sequelize.query("SELECT * FROM pedidopagamento where pedidoid = ?",
				{
					replacements: [pedid],
					type: sequelize.QueryTypes.SELECT
				})
			//Fim pagamentos

			//ENDERECO
			var address = await sequelize.query("SELECT * FROM pedidoendereco where pedidoid = ?",
				{
					replacements: [pedid],
					type: sequelize.QueryTypes.SELECT
				})
			if (address.length > 0)
				pedido.endereco = address[0]


			response.status(200).send({
				status: 'success',
				data: pedido,
				message: 'Success.'
			})

		} else {
			response.status(400).send({
				status: 'erro',
				message: 'Pedido não localizado.'
			})
		}

	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			message: 'Não foi possivel atender a solicitação!'
		});
	}
})

app.post("/postavaliacao", async (request, response) => {
	try {
		let post = request.body;
		var auth = await admin.auth().getUser(post.uid);
		var pedid = post.pedid;
		const snapuf = await admin.database().ref('/'.concat(post.path, '/loja/informacoes/Estado')).once('value');
		var uf = snapuf.val().toString();
		var fuso = getFusos(uf);
		var date = getHora(fuso);

		var datahora = formatDate(date);

		datahora = datahora.replace('/', '-').replace('/', '-');
		const resultTransaction = await sequelize.transaction(async (trans) => {

			var descricao = '* '
			var result = await sequelize.query("SELECT * FROM pedidoitens where pedid = ?",
				{
					replacements: [post.pedid],
					type: sequelize.QueryTypes.SELECT,
					transaction: trans
				})

			if (result.length > 0) {

				for (const item of result) {
					descricao = descricao.concat(item.NomeReduzido, '')

					var result2 = await sequelize.query("SELECT NomeReduzido FROM pedidoitenscomplementos where pedidoitensid = ?",
						{
							replacements: [item.idpedidoitens],
							type: sequelize.QueryTypes.SELECT,
							transaction: trans
						})

					var compl = ''
					if (result2.length > 0) {
						for (const item2 of result2) {
							compl = compl.concat(item2.NomeReduzido, ', ')
						}
					}

					if (compl !== '') {
						descricao = descricao.concat(' - ', compl, ' ')
					}
				}

				var sql = "INSERT INTO avaliacoes (`path`,`comida`,`entrega`,`app`,`descricao`,`data`,`url`,`name`,`uid`,`pedid`) VALUES (?,?,?,?,?,?,?,?,?,?)";

				await sequelize.query(sql,
					{
						replacements: [post.path, post.comida,
						post.entrega, post.app, descricao, datahora, post.url, post.name, post.uid, post.pedid],
						type: sequelize.QueryTypes.INSERT,
						transaction: trans
					})
			} else {
				response.status(400).send({
					status: 'erro',
					data: [],
					message: 'Pedido não localizado!'
				});
			}

		})

		response.status(200).send({
			status: 'success',
			data: post,
			message: 'Avaliação registrada com sucesso.'
		})
	} catch (erro) {
		response.status(400).send({
			status: 'erro',
			data: undefined,
			message: 'Não foi possivel atender a solicitação!'
		});
	}
})

app.get("/getpedidosanteriores", async (request, response) => {

	try {
		var uid = request.query.uid;
		var path = request.query.path;

		if (uid === null || path === null) {
			response.status(400).send([]);
		} else if (uid === undefined || path === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || path === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);
			const snapuf = await admin.database().ref('/'.concat(path, '/loja/informacoes/Estado')).once('value');
			var uf = snapuf.val().toString();
			var fuso = getFusos(uf);
			var datalong = new Date().getTime() - ((fuso + 3) * 3600000)

			var sql = "SELECT pedido.*, if(avaliacoes.pedid is null, 0 ,avaliacoes.pedid) as pedidoavaliado, "
				.concat("(if(avaliacoes.app is null,0,avaliacoes.app) + if(avaliacoes.comida is null, 0,avaliacoes.comida) + if(avaliacoes.entrega is null, 0 ,avaliacoes.entrega ))/3 as nota ",
					", datediff(now(), datahora) as dias FROM pedido left join avaliacoes ",
					"on pedido.pedid = avaliacoes.pedid ",
					"where pedido.uid like ? and pedido.path like ? and datalong < ? ",
					"order by pedido.pedid desc limit 10")
			var result = await sequelize.query(sql,
				{
					replacements: [uid, path, datalong],
					type: sequelize.QueryTypes.SELECT
				})

			response.status(200).send(result);
		}
	} catch (erro) {
		console.log('erro', erro)
		response.status(400).send([]);
	}

})

app.get("/getpedidoandamento", async (request, response) => {

	try {
		var uid = request.query.uid;
		var path = request.query.path;

		if (uid === null || path === null) {
			response.status(400).send([]);
		} else if (uid === undefined || path === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || path === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);

			var rfuso = await sequelize.query("SELECT DATE_ADD(now(), INTERVAL diffuso hour) as hora, diffuso as fuso FROM apploja where path like ?",
				{
					replacements: [path],
					type: sequelize.QueryTypes.SELECT
				})
			var fuso = (rfuso[0].fuso - 3); //subtrai 3 horas para pegar os ultimos pedidos

			var sql = "SELECT * FROM pedido where path like ? and datalong > UNIX_TIMESTAMP(DATE_ADD(now(), INTERVAL ? hour)) and uid like ? order by pedid desc"
			var result = await sequelize.query(sql,
				{
					replacements: [path, fuso, uid],
					type: sequelize.QueryTypes.SELECT
				})


			for (var item of result) {
				item.timeline = await sequelize.query("SELECT * FROM pedidotimeline where pedid = ?",
					{
						replacements: [item.pedid],
						type: sequelize.QueryTypes.SELECT
					})

				item.itens = await sequelize.query("SELECT * FROM pedidoitens where pedid = ?",
					{
						replacements: [item.pedid],
						type: sequelize.QueryTypes.SELECT
					})

				//Retorna os cupons
				var query = "SELECT engcupons.* FROM engcuponsvalidados inner join engcupons on engcuponsvalidados.cupid = "
					.concat("engcupons.idengcupons where engcuponsvalidados.pedid = ?")
				var cupons = await sequelize.query(query,
					{
						replacements: [item.pedid],
						type: sequelize.QueryTypes.SELECT
					})

				if (cupons.length > 0)
					item.cupom = cupons[0]
				//Fim dos cupons

				//Retorna o fidelidade
				var query = "SELECT * from fidelidadevalidado where pedid = ?"
				var fidelidades = await sequelize.query(query,
					{
						replacements: [item.pedid],
						type: sequelize.QueryTypes.SELECT
					})

				if (fidelidades.length > 0)
					item.fidelidade = fidelidades[0]
				//Fim dos fidelidade

				for (var item2 of item.itens) {
					item2.complementos = await sequelize.query("SELECT * FROM pedidoitenscomplementos where pedidoitensid = ?",
						{
							replacements: [item2.idpedidoitens],
							type: sequelize.QueryTypes.SELECT
						})
				}
			}
			response.status(200).send(result);
		}
	} catch (erro) {
		response.status(400).send([]);
	}

})

app.get("/getnotificacoes", async (request, response) => {
	try {
		var uid = request.query.uid;
		var path = request.query.path;
		if (uid === null || path === null) {
			response.status(400).send([]);
		} else if (uid === undefined || path === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || path === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);
			var sql = "SELECT * FROM notificacoes where path like ? order by id desc limit 20"
			var result = await sequelize.query(sql,
				{ replacements: [path], type: sequelize.QueryTypes.SELECT })

			response.status(200).send(result);
		}
	} catch (erro) {
		response.status(400).send(erro);
	}
})

app.get("/getinvitecode", async (request, response) => {
	try {
		var uid = request.query.uid;
		if (uid === null) {
			response.status(400).send([]);
		} else if (uid === undefined) {
			response.status(400).send([]);
		} else if (uid === '') {
			response.status(400).send([]);
		} else {
			//console.log(uid)
			var auth = await admin.auth().getUser(uid);
			var sql = "SELECT * FROM usuarios where uid like ?"
			var result = await sequelize.query(sql,
				{ replacements: [uid], type: sequelize.QueryTypes.SELECT })

			if (result.length > 0) {
				var code = result[0].inviteCode;
				if (code === null || code === undefined || code === '') {
					code = gerarCodigo()
					id = result[0].id.toString();
					code = id.concat(code)
					if (code.length > 10)
						code = code.substring(0, 10)
					sql = "update usuarios set inviteCode = ? where uid like ?"
					var result2 = await sequelize.query(sql,
						{
							replacements: [code, uid],
							type: sequelize.QueryTypes.UPDATE
						})
					result[0].inviteCode = code;
					response.status(200).send([result[0]]);
				} else {
					response.status(200).send([result[0]]);
				}
			} else {
				response.status(400).send([]);
			}
		}

	} catch (erro) {
		response.status(400).send([]);
	}
})

app.get("/validarinvite", async (request, response) => {
	try {
		var uid = request.query.uid;
		var code = request.query.code;
		if (uid === null || code === null) {
			response.status(400).send([]);
		} else if (uid === undefined || code === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || code === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);
			var sql = "SELECT * FROM usuarios where inviteCode like ?"
			var result = await sequelize.query(sql,
				{ replacements: [code], type: sequelize.QueryTypes.SELECT })
			response.status(200).send(result);
		}

	} catch (erro) {
		response.status(400).send([]);
	}
})

app.get("/getfidelidadehistorico", async (request, response) => {
	try {
		var uid = request.query.uid;
		var path = request.query.path;
		if (uid === null || path === null) {
			response.status(400).send([]);
		} else if (uid === undefined || path === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || path === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);

			var sql = "SELECT DATE_FORMAT(data, '%d/%m') as data, pontos, saldo, descricao, pedidoid,id FROM fidelidade where uid like ? and path like ? order by id desc;"
			var result = await sequelize.query(sql,
				{ replacements: [uid, path], type: sequelize.QueryTypes.SELECT })

			response.status(200).send(result);
		}
	} catch (erro) {
		response.status(400).send([]);
	}

})


app.post("/postcupons", async (request, response) => {
	try {
		var uid = request.query.uid;
		var path = request.query.path;
		var token = request.query.token;
		let cupom = request.body;
		if (uid === null || path === null) {
			response.status(400).send({
				status: 'erro',
				data: [],
				message: 'code 1!'
			});
		} else if (uid === undefined || path === undefined || cupom === undefined) {
			response.status(400).send({
				status: 'erro',
				data: [],
				message: 'code 2!'
			});
		} else if (uid === '' || path === '') {
			response.status(400).send({
				status: 'erro',
				data: [],
				message: 'code 3!'
			});
		} else {

			var auth = await admin.auth().getUser(uid);

			const resultTransaction = await sequelize.transaction(async (trans) => {

				var rsfidel0 = await sequelize.query("SELECT * FROM autenticacao where token like ? and path like ?",
					{
						replacements: [token, path],
						type: sequelize.QueryTypes.SELECT
					})

				if (rsfidel0.length > 0) {

					var sql = "INSERT INTO engcupons (valor, tag ,validade, minimo, path, `online`, quant, viarest, ativo) VALUES (?,?,?,?,?,?,?,?,?)";

					if (cupom.idengcupons > 0) {
						sql = "update engcupons set valor=?,tag=?,validade=?,minimo=?,quant=?,ativo=? where idengcupons = ?";

						var result = await sequelize.query(sql,
							{
								replacements: [cupom.valor, cupom.tag, cupom.validade2, cupom.minimo, cupom.quant, cupom.ativo, cupom.idengcupons],
								type: sequelize.QueryTypes.UPDATE,
								transaction: trans
							})
					} else {

						var result = await sequelize.query(sql,
							{
								replacements: [cupom.valor, cupom.tag, cupom.validade2, cupom.minimo, cupom.path, cupom.online, cupom.quant, cupom.viarest,
								cupom.ativo],
								type: sequelize.QueryTypes.INSERT,
								transaction: trans
							})

					}

					response.status(200).send(cupom)
				} else {
					response.status(400).send({
						status: 'erro',
						data: [],
						message: 'code 4!'
					});
				}
			})
		}
	} catch (error) {
		response.status(400).send({
			status: 'erro',
			data: error,
			message: 'code 5!'
		});
	}
})



app.get("/getallcupons", async (request, response) => {
	try {
		var uid = request.query.uid;
		var path = request.query.path;
		if (uid === null || path === null) {
			response.status(400).send([]);
		} else if (uid === undefined || path === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || path === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);
			const snapuf = await admin.database().ref('/'.concat(path, '/loja/informacoes/Estado')).once('value');
			var uf = snapuf.val().toString();
			var fuso = getFusos(uf);
			var date = getHora(fuso);

			var paran = formatDate(date).toString().substring(0, 10);
			paran = paran.replace('/', '-').replace('/', '-');

			var sql = "SELECT engcupons.*, (SELECT count(engcuponsvalidados.id) as utilizados FROM engcuponsvalidados where engcuponsvalidados.cupid = "
				.concat("engcupons.idengcupons) as utilizados from engcupons where engcupons.path like ?  order by idengcupons desc limit 100");
			var result = await sequelize.query(sql,
				{ replacements: [path], type: sequelize.QueryTypes.SELECT })

			response.status(200).send(result);
		}
	} catch (erro) {
		response.status(400).send(erro);
	}
})


app.get("/getcupons", async (request, response) => {
	try {
		var uid = request.query.uid;
		var path = request.query.path;
		if (uid === null || path === null) {
			response.status(400).send([]);
		} else if (uid === undefined || path === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || path === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);

			const snapuf = await admin.database().ref('/'.concat(path, '/loja/informacoes/Estado')).once('value');
			var uf = snapuf.val().toString();
			var fuso = getFusos(uf);
			var date = getHora(fuso);

			var paran = formatDate(date).toString().substring(0, 10);
			paran = paran.replace('/', '-').replace('/', '-');

			var sql = "SELECT engcupons.*, (select count(path) from engcuponsvalidados where cupid = idengcupons and uid = ? limit 1) as utilizado "
				.concat(" FROM engcupons where path like ? and validade >= ? and ativo = 1 and quant > 0")
			var result = await sequelize.query(sql,
				{ replacements: [uid, path, paran], type: sequelize.QueryTypes.SELECT })

			response.status(200).send(result);
		}
	} catch (erro) {
		response.status(400).send(erro);
	}
})

app.get("/getcuponsindisponiveis", async (request, response) => {
	try {
		var uid = request.query.uid;
		var path = request.query.path;
		if (uid === null || path === null) {
			response.status(400).send([]);
		} else if (uid === undefined || path === undefined) {
			response.status(400).send([]);
		} else if (uid === '' || path === '') {
			response.status(400).send([]);
		} else {
			await admin.auth().getUser(uid);
			const snapuf = await admin.database().ref('/'.concat(path, '/loja/informacoes/Estado')).once('value');
			var uf = snapuf.val().toString();
			var fuso = getFusos(uf);
			var date = getHora(fuso);
			var paran = formatDate(date).toString().substring(0, 10);
			paran = paran.replace('/', '-').replace('/', '-');

			var sql = "SELECT engcupons.*, (select count(path) from engcuponsvalidados where cupid = idengcupons and uid = ? limit 1) as utilizado "
				.concat(" FROM engcupons where path like ? and validade < ? and ativo = 1 or quant <= 0")
			var result = await sequelize.query(sql,
				{ replacements: [uid, path, paran], type: sequelize.QueryTypes.SELECT })

			response.status(200).send(result);
		}
	} catch (erro) {
		response.status(400).send(erro);
	}
})





app.post("/neworder", async (request, response) => {
	try {
		let order = request.body;
		var auth = await admin.auth().getUser(order.uid);
		var pedid = 0
		const resultTransaction = await sequelize.transaction(async (trans) => {

			var rfuso = await sequelize.query("SELECT DATE_ADD(now(), INTERVAL diffuso hour) as hora, diffuso as fuso FROM apploja where path like ?",
				{
					replacements: [order.path],
					type: sequelize.QueryTypes.SELECT,
					transaction: trans
				})
			var fuso = rfuso[0].fuso;

			//INSERIR PEDIDO
			//	console.log('INSERIR PEDIDO')
			var sql = "INSERT INTO pedido (`key`,datalong, distancia, taxa, valor, obs, uid, origem, platform, datahora,"
				.concat("latitude, longitude, path, `type`) VALUES (?, UNIX_TIMESTAMP(DATE_ADD(now(), INTERVAL ? hour)) ,?,?,?,?,?,?,?, DATE_ADD(now(), INTERVAL ? hour) ,?,?,?,?)");
			const [results, metadata] = await sequelize.query(sql,
				{
					replacements: [order.key, fuso, 0, order.taxa, order.valor, order.obs, order.uid,
						1, order.platform, fuso, 0, 0, order.path, order.type],
					type: sequelize.QueryTypes.INSERT,
					transaction: trans
				})

			console.log("results", results) //id
			pedid = results;

			//INSERIR PEDIDO TIMELINE
			await sequelize.query("INSERT INTO `pedidotimeline` (`time`,`title`,`description`,`path`,`pedid`) VALUES (DATE_FORMAT( DATE_ADD(now(), INTERVAL ? hour),'%H:%i'),?,?,?,?)",
				{
					replacements: [fuso, "Pedido enviado.", "Aguardando confirmação do restaurante.", order.path, pedid],
					type: sequelize.QueryTypes.INSERT,
					transaction: trans
				})


			//INSERIR USUARIO DO PEDIDO
			sql = "INSERT INTO pedidousuarios (nome, email,telefone,uid,token,pedidoid) VALUES (?,?,?,?,?,?)";
			await sequelize.query(sql,
				{
					replacements: [order.usuario.nome, order.usuario.email, order.usuario.telefone, order.usuario.uid,
					order.usuario.token, pedid],
					type: sequelize.QueryTypes.INSERT,
					transaction: trans
				})


			//INSERIR PAGAMENTO
			sql = "INSERT INTO pedidopagamento (pedidoid,name,code,value,prepaid2,externalCode,changeFor) VALUES (?,?,?,?,?,?,?)";
			//	Promise.all(order.payments.map(async (item) => {
			for (const item of order.payments) {
				item.changeFor === undefined ? 0 : item.changeFor
				item.changeFor === null ? 0 : item.changeFor
				await sequelize.query(sql,
					{
						replacements: [pedid, item.name, item.code, item.value, item.prepaid, item.externalCode, item.changeFor],
						type: sequelize.QueryTypes.INSERT,
						transaction: trans
					})
			}

			//INSERIR ENDEREÇO
			sql = "INSERT INTO pedidoendereco(bairro,cep,complemento,localidade,logradouro,numero,referencia,latitude,longitude,pedidoid) VALUES (?,?,?,?,?,?,?,?,?,?)"
			order.endereco.latitude === null ? 0 : order.endereco.latitude
			order.endereco.longitude === null ? 0 : order.endereco.longitude

			await sequelize.query(sql,
				{
					replacements: [order.endereco.bairro, order.endereco.cep, order.endereco.complemento,
					order.endereco.localidade, order.endereco.logradouro, order.endereco.numero, order.endereco.referencia,
					order.endereco.latitude, order.endereco.longitude, pedid],
					type: sequelize.QueryTypes.INSERT,
					transaction: trans
				})


			//INSERIR ITENS
			//	order.itens.map(async (item) => {
			for (const item of order.itens) {
				//console.log(item)
				if (item.desconto === undefined) item.desconto = 0
				if (item.tamanhoprodutoid === undefined) item.tamanhoprodutoid = 0
				if (item.sigla === undefined) item.sigla = ""
				if (item.nometamanho === undefined) item.nometamanho = ""
				if (item.nometipo === undefined) item.nometipo = ""
				if (item.nomeSabor === undefined) item.nomeSabor = ""

				var sql2 = "INSERT INTO pedidoitens(ProdutoID,Venda,desconto,NomeReduzido,Unidade,"
					.concat("Categoria,Quant,valorUnitarioFinal,CalcularComplenetos,Tipo,tamanhoid,tamanhoprodutoid,sigla,",
						"nometamanho,nometipo,nomeSabor,pedid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
				await sequelize.query(sql2,
					{
						replacements: [item.ProdutoID, item.Venda, item.desconto, item.NomeReduzido, item.Unidade,
						item.Categoria, item.Quant, item.valorUnitarioFinal, item.CalcularComplenetos, item.Tipo, item.tamanhoid, item.tamanhoprodutoid, item.sigla,
						item.nometamanho, item.nometipo, item.nomeSabor, pedid],
						type: sequelize.QueryTypes.INSERT,
						transaction: trans
					})

				if (item.complementos !== undefined) {
					//console.log('item.complementos', item.complementos)
					const rs2 = await sequelize.query('SELECT LAST_INSERT_ID() as pedidoitensid', {
						type: sequelize.QueryTypes.SELECT,
						transaction: trans
					})
					var pedidoitensid = rs2[0].pedidoitensid
					for (var compl of item.complementos) {
						var sql3 = "INSERT INTO pedidoitenscomplementos (ProdutoID,Quant,NomeReduzido,Venda,desconto,isCombo,pedidoitensid) "
							.concat("VALUES (?,?,?,?,?,?,?)");

						if (compl.desconto === undefined)
							compl.desconto = 0
						if (compl.isCombo === undefined || compl.isCombo === false)
							compl.isCombo = 0
						else if (compl.isCombo === true)
							compl.isCombo = 1

						await sequelize.query(sql3,
							{
								replacements: [compl.ProdutoID, compl.Quant, compl.NomeReduzido, compl.Venda, compl.desconto, compl.isCombo, pedidoitensid],
								type: sequelize.QueryTypes.INSERT,
								transaction: trans
							})
					}
				}
			}

			//INSERE CUPOM VALIDADOS CASO TENHA CUPOM
			if (order.cupom !== undefined) {
				sql = "INSERT INTO engcuponsvalidados (cupid, uid, path, pedid) VALUES (?,?,?,?)";
				await sequelize.query(sql,
					{
						replacements: [order.cupom.idengcupons, order.uid, order.path, pedid],
						type: sequelize.QueryTypes.INSERT,
						transaction: trans
					})
			}

			//INSERE FIDADELIDADEVALIDADO VALIDADOS CASO TENHA CUPOM
			if (order.fidelidade !== undefined) {
				sql = "INSERT INTO fidelidadevalidado (tag, valor, pedid) VALUES (?,?,?)";
				await sequelize.query(sql,
					{
						replacements: [order.fidelidade.tag, order.fidelidade.valor, pedid],
						type: sequelize.QueryTypes.INSERT,
						transaction: trans
					})
			}

		})
		/// TRANSATION END
		order.key = pedid.toString();
		if (pedid > 0) {

			await admin.database().ref()
				.child(order.path)
				.child('orders')
				.child(order.uid)
				.child(order.key)
				.child('status')
				.set(0)
		}

		response.status(200).send(order);

	} catch (erro) {

		response.status(400).send({
			status: 'erro 1',
			data: [],
			msg: erro
		});
	}
})

app.get("/getenderecos", async (request, response) => {

	try {
		var uid = request.query.uid;
		if (uid === null) {
			response.status(400).send([]);
		} else if (uid === undefined) {
			response.status(400).send([]);
		} else if (uid === '') {
			response.status(400).send([]);
		} else {
			var auth = await admin.auth().getUser(uid);
			var result = await sequelize.query("select * from address where uid = ?",
				{ replacements: [uid], type: sequelize.QueryTypes.SELECT })

			response.status(200).send(result);
		}
	} catch (erro) {
		response.status(400).send([]);
	}
})

app.post("/postuser", async (request, response) => {
	try {
		let user = request.body;
		if (user.invitedcode === undefined)
			user.invitedcode = ""
		await admin.auth().getUser(user.uid);
		var result = await sequelize.query("select * from usuarios where uid = ?",
			{ replacements: [user.uid], type: sequelize.QueryTypes.SELECT })
		if (result.length === 0) {
			var result2 = await sequelize.query("INSERT INTO usuarios (`displayName`, `phoneNumber`, `cpf`, `email`, `uid`, invitedcode) VALUES (?,?,?,?,?,?)",
				{
					replacements: [user.displayName, user.phoneNumber, user.cpf, user.email, user.uid, user.invitedcode],
					type: sequelize.QueryTypes.INSERT
				})
		} else {
			var result2 = await sequelize.query("update usuarios set `displayName`=?, `phoneNumber`=?, `cpf`=?, `email`=?, invitedcode=? where `uid` = ?",
				{
					replacements: [user.displayName, user.phoneNumber, user.cpf, user.email, user.invitedcode, user.uid],
					type: sequelize.QueryTypes.UPDATE
				})
		}

		response.status(200).send(user);

	} catch (erro) {
		console.log('erro ao processar');
		response.status(400).send(erro);
	}

})

app.get("/getuser", async (request, response) => {
	try {
		var uid = request.query.uid;
		await admin.auth().getUser(uid);
		var result = await sequelize.query("select * from usuarios where uid = ?",
			{ replacements: [uid], type: sequelize.QueryTypes.SELECT })

		response.status(200).send(result);

	} catch (erro) {
		response.status(400).send([]);
	}
})

app.get("/getavaliacoes", async (request, response) => {
	try {
		var path = request.query.path;
		var uid = request.query.uid;
		var auth = await admin.auth().getUser(uid);
		//console.log(auth);

		if (path === undefined || path === '') {
			response.status(200).send([]);
		} else {

			var result = await sequelize.query("select a2.*, (select count(uid) as total from avaliacoes as a1 where a1.uid = a2.uid and ".concat(
				"a1.path = ? group by uid) as count from avaliacoes as a2 where a2.path = ? order by id desc"),
				{ replacements: [path, path], type: sequelize.QueryTypes.SELECT })

			response.status(200).send(result);
		}

	} catch (erro) {
		response.status(400).send([]);
	}
})

app.get("/getUnidades", async (request, response) => {
	var data = {
		status: 'success'
	};
	try {
		var path = request.query.path;
		var uid = request.query.uid;
		var auth = await admin.auth().getUser(uid);

		if (path === undefined || path === '') {
			data.msg = 'Dados do restaurante inválido';
			data.status = 'error';
			data.code = 2;
			response.status(200).send(data);
		} else {
			const snap = await admin.database().ref('/'.concat('franquias/', path)).once('value');
			data.franquias = snap.val();
			response.status(200).send(data);
		}

	} catch (error) {
		data.msg = 'Dados do restaurante inválido';
		data.status = 'error';
		data.code = 2;
		response.status(400).send(data);
	}
})

app.get("/getLoja", async (request, response) => {
	var data = {
		status: 'success'
	};
	try {
		var path = request.query.path;
		var uid = request.query.uid;
		var auth = await admin.auth().getUser(uid);

		if (path === undefined || path === '') {
			data.msg = 'Dados do restaurante inválido';
			data.status = 'error';
			data.code = 2;
			response.status(200).send(data);
		} else {
			const snap = await admin.database().ref('/'.concat(path, '/loja')).once('value');
			data.loja = snap.val();
			response.status(200).send(data);
		}
	} catch (error) {
		data.msg = 'Dados do restaurante inválido';
		data.status = 'error';
		data.code = 2;
		response.status(400).send(data);
	}
})

app.get("/getAberto", async (request, response) => {

	var data = {
		status: 'success'
	};
	try {

		var path = request.query.path;
		var uid = request.query.uid;
		var auth = await admin.auth().getUser(uid);

		if (path === undefined || path === '') {
			data.msg = 'Dados do restaurante inválido';
			data.status = 'error';
			data.code = 2;
			response.status(200).send(data);
		} else {
			const snapuf = await admin.database().ref('/'.concat(path, '/loja/informacoes/Estado')).once('value');
			var uf = snapuf.val().toString();
			var fuso = getFusos(uf);
			var date = getHora(fuso);
			data.date = date;
			const snapHorarios = await admin.database().ref('/'.concat(path, '/loja/funcionamento')).once('value');
			var horarios = snapHorarios.val();
			data.open = isAberto(horarios, date);
			response.status(200).send(data);
		}
	} catch (error) {
		data.msg = 'Erro ao processar solicitação!';
		data.status = 'error';
		data.code = 2;
		response.status(500).send(data);
	}
})


app.get("/getappcardapio", async (request, response) => {
	var data = {
		status: 'success'
	};
	try {
		var path = request.query.path;
		var uid = request.query.uid;
		var auth = await admin.auth().getUser(uid);

		if (path === undefined || path === '') {
			data.msg = 'Restaurante não encontrado!';
			data.status = 'error';
			data.code = 2;
			response.status(400).send(data);
		} else {

			var result = await sequelize.query("SELECT * FROM apploja where path like ?",
				{ replacements: [path], type: sequelize.QueryTypes.SELECT })
			if (result.length > 0) {
				data.loja = result[0];
				data.loja.bairros = await sequelize.query("SELECT * FROM appbairros where atendido = true and path like ? order by descricao",
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })

				result = await sequelize.query("SELECT * FROM appadministracao where path like ?",
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })
				if (result.length > 0)
					data.loja.Administracao = result[0]

				result = await sequelize.query("SELECT * FROM appengpointsconfig where path like ?",
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })
				if (result.length > 0) {
					data.loja.engpoints = {}
					data.loja.engpoints.config = result[0]
				}

				data.loja.formas_pagamento = await sequelize.query("SELECT * FROM appformas_pagamento where path like ? order by ordem",
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })

				data.loja.funcionamento = await sequelize.query("SELECT * FROM appfuncionamento where path like ? order by dia",
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })

				result = await sequelize.query("SELECT * FROM appinformacoes where path like ?",
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })
				if (result.length > 0) {
					data.loja.informacoes = result[0]
				}

				result = await sequelize.query("SELECT case turnos when 0 then 'fechado' "
					.concat("when 1 and (time_to_sec(hora1) <= time_to_sec(DATE_ADD(now() , INTERVAL apploja.diffuso hour)) and time_to_sec(DATE_ADD(now() , INTERVAL apploja.diffuso hour)) <= time_to_sec(hora2)) then 'aberto' ",
						"when 2 and (time_to_sec(hora1) <= time_to_sec(DATE_ADD(now() , INTERVAL apploja.diffuso hour)) and time_to_sec(DATE_ADD(now() , INTERVAL apploja.diffuso hour)) <= time_to_sec(hora2)) ",
						"or  (time_to_sec(hora3) <= time_to_sec(DATE_ADD(now() , INTERVAL apploja.diffuso hour)) and time_to_sec(DATE_ADD(now() , INTERVAL apploja.diffuso hour)) <= time_to_sec(hora4))then 'aberto' ",
						"else 'fechado' end as situacao FROM appfuncionamento inner join apploja on appfuncionamento.path = apploja.path ",
						"where dia = (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) and appfuncionamento.path like ?"),
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })
				if (result.length > 0) {
					data.open = result[0].situacao === undefined ? false : (result[0].situacao === 'fechado' ? false : true)
				} else {
					data.open = false
				}

				data.menu = await sequelize.query("SELECT appcategorias.* FROM appcategorias inner join apploja on appcategorias.path = apploja.path "
					.concat("where  ((limitarHora = 0) or (limitarHora = 1 and time_to_sec(DATE_ADD(now() , INTERVAL apploja.diffuso hour)) between ",
						"time_to_sec(hora1) and time_to_sec(hora2))) and ativa = 1 and appcategorias.path like ?"),
					{ replacements: [path], type: sequelize.QueryTypes.SELECT })

				if (data.menu !== undefined) {
					for (const cat of data.menu) {
						cat.data = await sequelize.query("SELECT appprodutos.* FROM appprodutos inner join apploja on appprodutos.path = apploja.path "
							.concat("where Disponivel = 1 and appprodutos.path like ? and appprodutos.Categoria = ? and appprodutos.tipo = ? and (case ",
								"when (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) = 0 and appprodutos.indispdom = 0 then true ",
								"when (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) = 1 and appprodutos.indispseg = 0 then true ",
								"when (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) = 2 and appprodutos.indispter = 0 then true ",
								"when (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) = 3 and appprodutos.indispqua = 0 then true ",
								"when (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) = 4 and appprodutos.indispqui = 0 then true ",
								"when (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) = 5 and appprodutos.indispsex = 0 then true ",
								"when (DAYOFWEEK(DATE_ADD(now(), INTERVAL apploja.diffuso hour))-1) = 6 and appprodutos.indispsab = 0 then true ",
								"else false end) order by appprodutos.ordem"),
							{ replacements: [path, cat.catChave, cat.tipo], type: sequelize.QueryTypes.SELECT })

						if (cat.data !== undefined) {
							for (const prod of cat.data) {
								prod.grupos = await sequelize.query("SELECT * FROM appgrupos where pausado = 0 and appprodutoid = ? order by ordem",
									{ replacements: [prod.idappprodutos], type: sequelize.QueryTypes.SELECT })

								if (prod.grupos !== undefined) {
									for (const grupo of prod.grupos) {
										grupo.itens = await sequelize.query("SELECT * FROM appgrupoitens where idgrupo = ? and disponivel = 1 order by ordem",
											{ replacements: [grupo.idappgrupos], type: sequelize.QueryTypes.SELECT })
									}
								}

							}
						}


					}
				}

			}

		}

		response.status(200).send(data);

	} catch (erro) {
		data.msg = 'Erro ao processar dados!';
		data.status = 'error';
		data.code = 3;
		data.descricao = erro
		response.status(400).send(data);
	}
})




//https://us-central1-engfooddeliverytestes.cloudfunctions.net/getcardapio?path=engtec

exports.getimpotcardapio = functions.https.onRequest(async (request, response) => {

	var data = {
		status: 'success'
	};
	try {

		var path = request.query.path;
		var uf = request.query.uf;
		var uid = request.query.uid;
		var auth = await admin.auth().getUser(uid);

		if (path === undefined || path === '') {
			data.msg = 'Restaurante não encontrado!';
			data.status = 'error';
			data.code = 2;
			response.status(200).send(data);
		} else {

			if (uf === undefined || uf === null) {
				const snapuf = await admin.database().ref('/'.concat(path, '/loja/informacoes/Estado')).once('value');
				uf = snapuf.val().toString();
			}
			var fuso = getFusos(uf);
			var date = getHora(fuso);
			data.date = date;
			var diasemana = date.getDay();

			//Acesso ao cardapio firebase
			const snap = await admin.database().ref('/'.concat(path, '/menu')).once('value');

			const snaploja = await admin.database().ref('/'.concat(path, '/loja')).once('value');
			data.loja = snaploja.val();

			if (data.loja.bairros !== undefined) {
				data.loja.bairros = Object.values(data.loja.bairros)
			}

			if (data.loja.formas_pagamento !== undefined) {
				data.loja.formas_pagamento = Object.values(data.loja.formas_pagamento)
			}

			//Retorna as categorias
			const cats = snap.val().categorias;
			var categorias = Object.keys(cats).map(key => {
				cats[key].tipo = 0;
				return cats[key];
			});

			const snapHorarios = await admin.database().ref('/'.concat(path, '/loja/funcionamento')).once('value');
			var horarios = snapHorarios.val();
			data.open = isAberto(horarios, date);





			//Retorna os tamanhos tamanhos		

			const tams = snap.val().produtostamanhos;
			var produtostamanhos = [];
			if (tams !== undefined) {
				produtostamanhos = Object.keys(tams).map(key => {
					tams[key] = setDisponivelDia(tams[key], diasemana);

					//	tams[key].Quant = 1;
					//	tams[key].Venda =0;
					tams[key].selected = 0;

					return tams[key];
				});
			}



			//Retorna os Tamanhos
			const tam = snap.val().tamanhos;
			var tamanhos = [];
			if (tam !== undefined) {
				tamanhos = Object.keys(tam).map(key => {
					tam[key].Disponivel = true//tam[key].disponivel == 1 ? true : false;
					tam[key].disponivel = true //tam[key].disponivel == 1 ? true : false;
					tam[key].NomeReduzido = tam[key].nome;
					tam[key].Tipo = tam[key].tipoid;
					tam[key].Categoria = tam[key].tipoid;
					//	tam[key] = setDisponivelDia(tam[key], diasemana);
					//CalcularComplenetos    0 = media/ 1= maior valor / 2 = adiciona cada
					tam[key].CalcularComplenetos = tam[key].multsaboresmaiorvalor === undefined ? 2 : (tam[key].multsaboresmaiorvalor === 0 ? 2 : 1)

					//	tam[key].Venda = 0;


					return tam[key];
				});
			}

			//Retorna os tipos
			const tps = snap.val().tipos;
			var tipos = [];
			if (tps !== undefined) {
				tipos = Object.keys(tps).map(key => {
					tps[key].tipo = tps[key].catChave;
					return tps[key];
				});

			}

			tamanhos = tamanhos.map(item => {
				var grupo = {
					chave: 99998,
					descricao: "Selecione o(s) sabor(es).",
					maximo: item.meioameio === 0 ? 1 : item.maxsabores,
					minimo: item.meioameio === 0 ? 1 : item.maxsabores,
					obrigatorio: 1,
					selected: 0,
					itens: []
				}

				if (grupo.maximo === 0) {
					grupo.maximo = 1;
					grupo.minimo = 1;
				}

				var temp = produtostamanhos.filter((produto) => {
					return produto.tamanhoid === item.tamanhoid;
				})

				temp.map(subitem => {
					grupo.itens.push({
						nome: subitem.NomeReduzido, // grupo.maximo > 1 ? "1/".concat(grupo.maximo, '  ', subitem.NomeReduzido) : subitem.NomeReduzido,
						produtoid: subitem.ProdutoID,
						idgrupo: 99998,
						selected: 0,
						valor: subitem.Venda, //subitem.Venda / (grupo.maximo >= 1 ? grupo.maximo : 1),
						valorUnitario: subitem.Venda
					});
				})
				if (grupo.itens !== null) {
					var from = 0;
					from = grupo.itens.reduce((a, b) => Math.min(a, b.valorUnitario), 10000000);

					item.from = 'a partir de R$'.concat(from.toFixed(2));
				}
				item.grupos = [];
				item.grupos.push(grupo);

				return item;
			})

			tipos = tipos.map(item => {
				item.data = tamanhos.filter((produto) => {
					return produto.tipoid === item.tipo;
				})
				return item;
			})

			tipos.map(item => {
				categorias.push(item);
			})

			// -------------  Fim dos tamanhos  -------------------------------------------------------

			// INICIO PRODUTOS NORMAIS
			const pds = snap.val().produtos;

			var produtos = Object.keys(pds).map(key => {
				//	pds[key] = setDisponivelDia(pds[key], diasemana);
				return pds[key];
			});



			produtos = produtos.map(item => {

				if (item.grupos === undefined)
					item.grupos = [];
				else {

					item.grupos = item.grupos.filter(gp => {



						gp.itens = gp.itens.sort(function (a, b) {
							if (a.ordem === undefined)
								a.ordem = 0;
							if (b.ordem === undefined)
								b.ordem = 0;
							return a.ordem < b.ordem ? -1 : a.ordem > b.ordem ? 1 : 0;
						});

						return gp.pausado === 0 && gp.itens.length > 0
					})

					item.grupos = item.grupos.sort(function (a, b) {
						if (a.ordem === undefined)
							a.ordem = 0;
						if (b.ordem === undefined)
							b.ordem = 0;
						return a.ordem < b.ordem ? -1 : a.ordem > b.ordem ? 1 : 0;
					});
				}

				if (item.Combo1 !== undefined && item.Combo1.length > 0) {
					var grupo1 = {
						chave: 99995,
						descricao: item.combo1descricao,
						maximo: item.combo1selecao,
						minimo: item.combo1selecao,
						obrigatorio: 1,
						selected: 0,
						produtoid: 0,
						itens: []
					}

					item.Combo1.map(subitem => {
						if (subitem.itemNome !== undefined && subitem.itemComboID !== undefined) {
							var sub = {
								nome: subitem.itemNome,
								produtoid: subitem.itemComboID,
								idgrupo: 99995,
								selected: 0,
								valor: subitem.itemCombo.venda,

							}
							//if (subitem.Disponivel === true)
							grupo1.itens.push(sub);
						}
					})
					if (grupo1.itens.length > 0)
						item.grupos.push(grupo1);

					delete item.Combo1;
				}

				//  COMBO 2
				if (item.Combo2 !== undefined && item.Combo2.length > 0) {

					var grupo2 = {
						chave: 99996,
						descricao: item.combo2descricao,
						maximo: item.combo2selecao,
						minimo: item.combo2selecao,
						obrigatorio: 1,
						selected: 0,
						produtoid: 0,
						itens: []
					}

					item.Combo2.map(subitem => {
						if (subitem.itemNome !== undefined && subitem.itemComboID !== undefined) {
							var sub = {
								nome: subitem.itemNome,
								produtoid: subitem.itemComboID,
								idgrupo: 99996,
								selected: 0,
								valor: subitem.itemCombo.venda,
							}
							//if (subitem.Disponivel === true)
							grupo2.itens.push(sub);
						}
					})
					if (grupo2.itens.length > 0)
						item.grupos.push(grupo2);
					delete item.Combo2;
				}


				//  COMBO 3
				if (item.Combo3 !== undefined && item.Combo3.length > 0) {
					var grupo3 = {
						chave: 99997,
						descricao: item.combo3descricao,
						maximo: item.combo3selecao,
						minimo: item.combo3selecao,
						obrigatorio: 1,
						selected: 0,
						produtoid: 0,
						itens: []
					}

					item.Combo3.map(subitem => {
						if (subitem.itemNome !== undefined && subitem.itemComboID !== undefined) {
							var sub = {
								nome: subitem.itemNome,
								produtoid: subitem.itemComboID,
								idgrupo: 99997,
								selected: 0,
								valor: subitem.itemCombo.venda,
							}
							//if (subitem.Disponivel === true)
							grupo3.itens.push(sub);
						}
					})
					if (grupo3.itens.length > 0)
						item.grupos.push(grupo3);
					delete item.Combo3;
				}



				//Complementos
				if (item.Complementos !== undefined && item.Complementos.length > 0) {
					var grupo4 = {
						chave: 99999,
						descricao: item.complementosDescricao,
						maximo: item.complemetosSel,
						minimo: 0,
						obrigatorio: 0,
						selected: 0,
						produtoid: 0,
						itens: []
					}

					item.Complementos.map(subitem => {

						if (subitem.NomeReduzido !== undefined) {
							var sub = {
								nome: subitem.NomeReduzido,
								produtoid: subitem.ProdutoID,
								idgrupo: 99999,
								selected: 0,
								valor: subitem.Venda,
							}
							//if (subitem.Disponivel === true)
							grupo4.itens.push(sub);
						}
					})
					if (grupo4.itens.length > 0)
						item.grupos.push(grupo4);
					delete item.Complementos;
				}

				item.Tipo = 0
				item.tamanho = 0

				return item;

			})

			console.log('Produtos', "ok")

			// --------------FIM PRODUTOS NORMAIS ------------------------------------------------------


			categorias = categorias.map(cat => {

				if (cat.tipo == 0) {
					cat.data = produtos.filter(prod => {
						return prod.Categoria === cat.catChave;
					})
				}

				return cat;
			})


			categorias = categorias.filter(cat => {
				return cat.data.length > 0;
			})


			categorias = categorias.sort(function (a, b) {
				if (a.ordem === undefined)
					a.ordem = 0;
				if (b.ordem === undefined)
					b.ordem = 0;
				return a.ordem < b.ordem ? -1 : a.ordem > b.ordem ? 1 : 0;
			});

			data.menu = categorias;

			//retorna um json
			response.status(200).send(data);

		}


	} catch (erro) {
		data.msg = 'Erro ao processar dados!';
		data.status = 'error';
		data.code = 3;
		data.descricao = erro
		response.status(200).send(data);
	}


})


exports.setIDUser = functions.https.onRequest((request, response) => {

	let uid = request.query.uid;
	let no = request.query.no;
	let text = "";
	var possible1 = "0123456789";
	var possible2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	console.log("setIDUser: uid", uid);
	console.log("setIDUser: no", no);

	text += possible1.charAt(Math.floor(Math.random() * possible1.length));
	text += possible2.charAt(Math.floor(Math.random() * possible2.length));
	text += possible1.charAt(Math.floor(Math.random() * possible1.length));
	text += possible2.charAt(Math.floor(Math.random() * possible2.length));
	text += possible1.charAt(Math.floor(Math.random() * possible1.length));
	text += possible2.charAt(Math.floor(Math.random() * possible2.length));
	text += possible1.charAt(Math.floor(Math.random() * possible1.length));
	text += possible2.charAt(Math.floor(Math.random() * possible2.length));
	text += possible1.charAt(Math.floor(Math.random() * possible1.length));
	text += possible2.charAt(Math.floor(Math.random() * possible2.length));

	//response.status(200).send(text);

	admin.database().ref('/' + no + '/users/' + uid).once('value')
		.then(snap => {

			if (snap.exists()) {
				admin.database().ref('/' + no + '/fidelidade/codigos/' + uid + '/codigo').set(text)
					.then(a => {
						console.log("setIDUser:", "response.Status == 200");
						response.status(200).send(": ok : ");
					})
					.catch(e => {
						console.log("setIDUser:", " erro no retorno");
						response.status(500).send(": ok : ");
					})

			} else {
				console.log("setIDUser:", "snap.exists() == false");
				response.status(200).send(": ok : ");
			}
		})
		.catch(a => {
			console.log("setIDUser:", "erro 50");
			response.status(500).send(": ok : ");
		})


});


exports.criarCodeFidelidadeUser = functions.database.ref('/{default}/users/{key}')
	.onCreate((snap, context) => {

		let user = snap.val();
		let uid = snap.key;
		let no = context.params.default;
		let text = "";

		if (user != null) {
			var possible1 = "0123456789";
			var possible2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			text += possible1.charAt(Math.floor(Math.random() * possible1.length));
			text += possible2.charAt(Math.floor(Math.random() * possible2.length));
			text += possible1.charAt(Math.floor(Math.random() * possible1.length));
			text += possible2.charAt(Math.floor(Math.random() * possible2.length));
			text += possible1.charAt(Math.floor(Math.random() * possible1.length));
			text += possible2.charAt(Math.floor(Math.random() * possible2.length));
			text += possible1.charAt(Math.floor(Math.random() * possible1.length));
			text += possible2.charAt(Math.floor(Math.random() * possible2.length));
			text += possible1.charAt(Math.floor(Math.random() * possible1.length));
			text += possible2.charAt(Math.floor(Math.random() * possible2.length));

			admin.database().ref('/' + no + '/users/' + uid).once('value').then(snap => {

				if (snap.exists()) {
					admin.database().ref('/' + no + '/fidelidade/codigos/' + uid + '/codigo').set(text)
						.then(a => {
							console.log("criarCodeFidelidadeUser:", "response.Status == 200");

							if (user.inviteCode !== undefined)
								funSetPedido(no, user.inviteCode, uid);

							return 0;
						})
						.catch(e => {
							console.log("criarCodeFidelidadeUser:", "Cath chamdo");
							return 1;
						})
				} else {
					console.log("criarCodeFidelidadeUser:", "snap.exists() == false");
					return 0;
				}
			})

				.catch(error => {
					console.log("criarCodeFidelidadeUser:", "error");
					return 1;
				})
		}

	})




//Para envia notificação de alteração de pedido
function checkcancelamento(key, no) {
	setTimeout(function () {
		var now = new Date();
		admin.database().ref('/' + no + '/pedidos/' + key).once('value').then(snap => {
			if (snap.exists()) {
				if (snap.val().status == 0) {
					admin.database().ref('/' + no + '/pedidos/' + key + '/status').set(2);
				}

			} else {

			}
		});
	}, 400000);
};




getHora = (fuso) => {

	var dateServer = new Date();
	var ano = dateServer.getFullYear();
	var mes = dateServer.getMonth();
	var dia = dateServer.getDate();
	var hora = dateServer.getHours();
	var min = dateServer.getMinutes();

	var horaLocal = hora - fuso;
	if (horaLocal < 0) {
		horaLocal = 24 + horaLocal;
		dia = dia - 1;
		if (dia === 0) {
			mes = mes - 1;
			if (mes === 0) {
				ano = ano - 1;
			}
		}

	} else {

	}

	var tem = new Date(ano, mes, dia, horaLocal, min);

	return tem;
}


getFusos = (uf) => {
	var fuso = timezonepadrao;
	uf = uf.toUpperCase();
	try {
		switch (uf) {
			case 'AP':
			case 'PA':
			case 'MA':
			case 'CE':
			case 'PE':
			case 'RN':
			case 'PB':
			case 'AL':
			case 'BA':
			case 'GO':
			case 'DF':
			case 'PI':
			case 'TO':
			case 'SP':
			case 'RJ':
			case 'MG':
			case 'PR':
			case 'SC':
			case 'SE':
				fuso = timezonepadrao;
				break;

			case 'RR':
			case 'AM':
			case 'PA':
			case 'RO':
			case 'MT':
			case 'MS':
				fuso = timezonepadrao + 1;
				break;

			case 'AC':
				fuso = timezonepadrao + 2;
				break;
		}
	} catch (erro) {

	}
	return fuso;

}



limitarHorariocategoria = (cat, date) => {
	try {
		if (cat.Ativa === false) {
			return false;
		} else {
			var horavalida = true;
			if (cat.limitarHora === true) {
				var hora1 = cat.hora1.split(':');
				var hora2 = cat.hora2.split(':');
				var minutos1 = (parseInt(hora1[0]) * 60) + parseInt(hora1[1]);
				var minutos2 = (parseInt(hora2[0]) * 60) + parseInt(hora2[1]);
				var minutosAtual = (date.getHours() * 60) + date.getMinutes();
				if (minutosAtual < minutos1 || minutosAtual > minutos2) {
					horavalida = false;
				}
			}
			return horavalida;
		}

	} catch (erro) {
		return true;
	}
}



setDisponivelDia = (item, diasemana) => {
	try {
		if (item.Disponivel) {
			switch (diasemana) {
				case 0:
					item.Disponivel = !indispdom
					break;
				case 1:
					item.Disponivel = !indispseg
					break;
				case 2:
					item.Disponivel = !indispter
					break;
				case 3:
					item.Disponivel = !indispqua
					break;
				case 4:
					item.Disponivel = !indispqui
					break;
				case 5:
					item.Disponivel = !indispsex
					break;
				case 6:
					item.Disponivel = !indispsab
					break;

			}
		}

	} catch (erro) {

	}

	return item;
}






function formatDate(today) {

	var day = today.getDate() + "";
	var month = (today.getMonth() + 1) + "";
	var year = today.getFullYear() + "";
	var hour = today.getHours() + "";
	var minutes = today.getMinutes() + "";
	var seconds = today.getSeconds() + "";

	day = checkZero(day);
	month = checkZero(month);
	year = checkZero(year);
	hour = checkZero(hour);
	mintues = checkZero(minutes);
	seconds = checkZero(seconds);

	return (year + "/" + month + "/" + day + " " + hour + ":" + mintues + ":" + seconds)
}

function checkZero(data) {
	if (data.length == 1) {
		data = "0" + data;
	}
	return data;
}


function gerarCodigo() {
	var text = "";
	var possible1 = "0123456789";
	var possible2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	text += possible1.charAt(Math.floor(Math.random() * possible1.length));
	text += possible2.charAt(Math.floor(Math.random() * possible2.length));
	text += possible1.charAt(Math.floor(Math.random() * possible1.length));
	text += possible2.charAt(Math.floor(Math.random() * possible2.length));

	return text;
}


async function authRest(token, path) {
	try {
		var resaut = await sequelize.query("SELECT * FROM autenticacao where token like ? and path like ?",
			{
				replacements: [token, path],
				type: sequelize.QueryTypes.SELECT
			})
		if (resaut.length > 0)
			return 1;
		else
			return 0;
	} catch (erro) {
		return -1;
	}
}


app.listen(80, () => {
	console.log('API Executando...')
})




