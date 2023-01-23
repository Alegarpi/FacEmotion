// Not giving good results. Training Neural Network

let counter = 0;
const loadImage = src =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>  {
      counter++;
      console.log(counter);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  })  
;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

async function getInputs() {
  let img_url = [];
  let angry = [];
  let disgust = [];
  let fear = [];
  let happy = []
  let neutral = [];
  let sad = []
  let surprise = [];

  for(let i = 1; i <= 1000;i++ ) {
    img_url.push("./data/angry/img (" + i + ").jpg");
    // img_url.push("./data/disgust/img (" + i + ").jpg");
    //img_url.push("./data/fear/img (" + i + ").jpg");
    img_url.push("./data/happy/img (" + i + ").jpg");
    img_url.push("./data/neutral/img (" + i + ").jpg");
    img_url.push("./data/sad/img (" + i + ").jpg");
    //img_url.push("./data/surprise/img (" + i + ").jpg");
  }
  await Promise.all(img_url.map(loadImage)).then( images => {
    images.forEach((image, i) => {
      switch (image.src.split("/")[4]) {
        case "angry":
          angry.push([image,image.src.split("/")[4]]);
          break;
        case "sad":
          sad.push([image,image.src.split("/")[4]]);
          break;

        case "neutral":
          neutral.push([image,image.src.split("/")[4]]);
          break;
        case "happy":
          happy.push([image,image.src.split("/")[4]]);
          break;
    
        default:
          console.log(image.src.split("/")[4]);
          break;
      }
    });
  })

  const TRAIN_LIMIT = Math.round(angry.length * 75 / 100);
  let training = angry.splice(0,TRAIN_LIMIT).concat(disgust.splice(0,TRAIN_LIMIT),
            sad.splice(0,TRAIN_LIMIT),happy.splice(0,TRAIN_LIMIT),
            neutral.splice(0,TRAIN_LIMIT),surprise.splice(0,TRAIN_LIMIT),
            fear.splice(0,TRAIN_LIMIT)
      );
  shuffleArray(training);
  let testing = angry.splice(-TRAIN_LIMIT).concat(disgust.splice(-TRAIN_LIMIT),
                sad.splice(-TRAIN_LIMIT),happy.splice(-TRAIN_LIMIT),
                neutral.splice(-TRAIN_LIMIT),surprise.splice(-TRAIN_LIMIT),
                fear.splice(-TRAIN_LIMIT)
      );
  shuffleArray(testing);
  return [training,testing];
}

function whileTraining(epoch, loss) {
  console.log(epoch,loss);
}

function finishedTraining() {
  console.log("Entrenamiento terminado");
}

async function go() {
  const IMAGE_WIDTH = 48;
  const IMAGE_HEIGHT = 48;
  const IMAGE_CHANNELS = 4;

  const options = {
    inputs:[IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
    task: 'imageClassification',
    learningRate: 0.00125,
    debug: true,
    layers: [
      {
        type: 'conv2d',
        filters: 8,
        kernelSize: 5,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      },
      {
        type: 'maxPooling2d',
        poolSize: [2, 2],
        strides: [2, 2],
      },
      {
        type: 'conv2d',
        filters: 16,
        kernelSize: 5,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
      },
      {
        type: 'maxPooling2d',
        poolSize: [2, 2],
        strides: [2, 2],
      },
      {
        type: 'flatten',
      },
      {
        type: 'dense',
        kernelInitializer: 'varianceScaling',
        activation: 'sigmoid',
      },
    ]
  }
  let model = ml5.neuralNetwork(options);
  console.log("Modelo cargado");
  let [trainInputs, testInputs] = await getInputs();

  console.log(trainInputs)
  console.log("train separado");
  for (let i = 0; i < trainInputs.length; i++) {
    const input = {
      image: trainInputs[i][0]
    }
    const target = {
      label: trainInputs[i][1]
    }
    model.addData(input, target);
  }
  model.normalizeData();
  console.log("Datos añadidos");
  
  console.log("start train");
  const trainOptions = {
    epochs: 100,
    batchSize: 100,
    validationSplit: 0,
    shuffle: true,
  }
  model.train(trainOptions, whileTraining, finishedTraining);

  document.addEventListener('keydown', async (event) => {
    let name = event.key;
    if (name == "n") {
      console.log("Empieza el test");
      let results = [];
      for (let i = 0; i < testInputs.length; i++) {
        await model.classify({image: testInputs[i][0]}, (e,r) => {
          if (e)
            console.log(e);
          else {
            r.sort((a, b) => b.confidence - a.confidence);
            results.push([testInputs[i][1], r[0].label]);
          }
        });
      }
      results = results.map((r,ind,results) => {
        if (r[0] == r[1])
          return 1;
        else 
          return 0;
      });
      console.log(results.filter((val) => val == 1).length / results.length);
    } else if(name == "s") {
        model.save();
    } else {
      console.log(name);
    }
  }, false);

}

go();