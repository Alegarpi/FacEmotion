// NOT WORKING AS SUPPOSED. RESULTS ARE BAD
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
    img.mask = src.split("/")[2];
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
  let mask = [];
  let unmask = []
  var arr = [];
  while(arr.length < 200){
      var r = Math.floor(Math.random() * 200) + 1;
      if(arr.indexOf(r) === -1) arr.push(r);
  }
  for(let i = 0; i < arr.length;i++ ) {
    let x = arr[i];
    if (x != 13 && x != 14 && x != 22 && x != 33 && x != 2995 && x != 2996) {
      img_url.push("./Dataset/with_mask/" + x + ".png");
    }
    if (x != 2995 && x != 2996 && x != 2997 && x != 2998 && x != 2999 && x != 3000) {
      img_url.push("./Dataset/without_mask/" + x + ".png");
    }
  }
  await Promise.all(img_url.map(loadImage)).then( images => {
    images.forEach((image, i) => {
      if (image.mask == "with_mask")
        mask.push(image);
      else
        unmask.push(image);
    });
  })

  shuffleArray(mask);
  shuffleArray(unmask);
  const TRAIN_LIMIT1 = Math.round(mask.length * 7 / 10);
  const TRAIN_LIMIT2 = Math.round(unmask.length * 7 / 10);
  let training = mask.splice(0,TRAIN_LIMIT1).concat(unmask.splice(0,TRAIN_LIMIT2));
  shuffleArray(training);
  let testing = mask.splice(-TRAIN_LIMIT1).concat(unmask.splice(-TRAIN_LIMIT2));
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
  const IMAGE_WIDTH = 128;
  const IMAGE_HEIGHT = 128;
  const IMAGE_CHANNELS = 4;

  const options = {
    inputs:[IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
    task: 'imageClassification',
    learningRate: 0.0125,
    debug: true
  }
  let model = ml5.neuralNetwork(options);
  console.log("Modelo cargado");
  let [trainInputs, testInputs] = await getInputs();

  console.log("train separado");
  for (let i = 0; i < trainInputs.length; i++) {
    const input = {
      image: trainInputs[i]
    }
    const target = {
      label: trainInputs[i].mask
    }
    model.addData(input, target);
  }
  console.log("Datos añadidos");
  model.normalizeData();
  console.log("Datos normalizados");
  
  console.log("start train");
  const trainOptions = {
    epochs: 30,
    batchSize: 8
  }
  model.train(trainOptions, whileTraining, finishedTraining);

  document.addEventListener('keydown', async (event) => {
    let name = event.key;
    if (name == "n") {
      let results = [];
      for (let i = 0; i < testInputs.length; i++) {
        await model.classify({image: testInputs[i]}, (e,r) => {
          if (e)
            console.log(e);
          else {
            r.sort((a, b) => b.confidence - a.confidence);
            results.push([testInputs[i].mask, r[0].label]);
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