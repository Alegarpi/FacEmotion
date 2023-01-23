// Testing old model -> not really good
function whileTraining(epoch, loss) {
  console.log(epoch);
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
    outputs: 2,
    task: 'imageClassification',
    debug: true
  }
  let model = ml5.neuralNetwork(options);
  const modelInfo = {
    model: './maskModel3/model.json',
    metadata: './maskModel3/model_meta.json',
    weights: './maskModel3/model.weights.bin'
  }
  debugger;
  model.load(modelInfo, () => console.log("Modelo cargado"));

  //model.loadData('data2.json', () => console.log(model.data));
  //model.normalizeData();
  //const trainOptions = {
    //epochs: 20
  //}
  //model.train(trainOptions, whileTraining, finishedTraining);
  let img1 = new Image();
  let img2 = new Image();
  img1.src = './Dataset/with_mask/44.png';
  img1.onload = () => console.log("im1 lista");
  img2.src = './Dataset/without_mask/44.png';
  img2.onload = () => console.log("im2 lista");
  document.addEventListener('keydown', async (event) => {
    let name = event.key;
    if (name == "n") {
      console.log(model);
    } else if(name == "p") {
      model.classify({image: img1}, (e,r) => {
        if (e)
          console.log(e);
        else
          console.log("IM1 con mask");
          console.log(r);
      });
      model.classify({image: img2}, (e,r) => {
        if (e)
          console.log(e);
        else
          console.log("Im2 SIN mask");
          console.log(r);
      });
    } else {
      console.log(name);
    }
  }, false);
}

go();