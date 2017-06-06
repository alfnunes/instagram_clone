let express = require('express');
let bodyParser = require('body-parser');
let mongoDb = require('mongodb');
let multiparty = require('connect-multiparty');
let fs = require('fs');
let objectId = require('mongodb').ObjectId;

let app = express();

app.use(bodyParser.urlencoded({extend : true}));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function(req, res, next){
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers','content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

let db = new mongoDb.Db(
    'instagram',
    new mongoDb.Server('localhost', 27017, {}),
    {}
);


app.get('/', function(req, res){
    res.send({msg : 'Olá'});
});


app.get('/api', function(req, res){
          
     db.open(function(err, mongoClient){
        mongoClient.collection('postagens',function(err, collection){
            let data = collection.find().toArray(function(err, resut){
                if(err){
                    res.json(err);
                }else{
                     res.json(resut);
                }

                mongoClient.close();
            });
        });
    });
});

app.get('/api/:id', function(req, res){
     db.open(function(err, mongoClient){
        mongoClient.collection('postagens',function(err, collection){
            let data = collection.find({_id : new objectId(req.params.id)}).toArray(function(err, resut){
                if(err){
                    res.json(err);
                }else{                   
                    if(resut.length > 0){
                      res.status(200).json(resut);
                    }else{
                      res.status(404).json(resut);
                    }
                }

                mongoClient.close();
            });
        });
    });
});

app.get('/imagens/:imagem', function(req, res){
   let img = req.params.imagem;

   fs.readFile('./uploads/' + img, function(err, content){
       if(err){
           res.status(400).json({err : err});
           return;
       }
       
       res.writeHead(200,{'Content-type' : 'image/jpg'});
       res.end(content);
   });
});

app.delete('/api/:id', function(req, res){
     db.open(function(err, mongoClient){
        mongoClient.collection('postagens',function(err, collection){
            collection.update(
                { },
                { $pull : {
                            comentarios : { id_comentarios : objectId(req.params.id)}
                          } 
                },
                { multi : true },
                function(err , result){
                    if(err){
                        res.json(err);
                    }else{
                        res.json(result);
                    }
                    mongoClient.close();
                }
            );
        });
    });    
});

app.put('/api/:id', function(req, res){
    let dados = req.body;
    db.open(function(err, mongoClient){
        mongoClient.collection('postagens',function(err, collection){
            collection.update(
                { _id : new objectId(req.params.id) },
                { $push : {
                            comentarios : {
                                            id_comentarios : new objectId(),
                                            comentario : dados.comentario
                                          } 
                           }
                },
                {},
                function(err, result){
                    if(err){
                        res.json(err);
                    }else{
                        res.json(result);
                    }

                    mongoClient.close();
                }
            );
        });
    });   
});

app.post('/api', function(req, res){

    let date = new Date();
    let time_stamp = date.getTime();

    let dados = req.body;

    let path_origem = req.files.arquivo.path;
    let file_name = time_stamp + '_' + req.files.arquivo.originalFilename;
    let path_destino = './uploads/' + file_name;

    fs.rename(path_origem, path_destino, function(err){
        if(err){
            res.status(500).json({error: err});
        }

        dados.url_imagem = file_name;

        db.open(function(err, mongoClient){
            mongoClient.collection('postagens',function(err, collection){
                collection.insert(dados, function(err, result){
                    if(err){
                        res.json({status : 'erro'});
                    }else{
                        res.json({status : 'inclusão realizada com sucesso'})
                    }
                    mongoClient.close();
                });
            });
        });
    });   
});

let port = 3000;

app.listen(port, function(){
    console.log('Server Online');
});



