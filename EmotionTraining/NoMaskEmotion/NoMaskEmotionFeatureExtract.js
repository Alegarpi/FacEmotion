// Transfer Learning method
const model = ml5.featureExtractor('MobileNet',{numLabels:3}, modelLoaded);

async function modelLoaded() {
  let counter = 0;
  let classifier = await model.classification();
  console.log("classification");
  const loadImage = src =>
    new Promise((resolve, reject) => {
      let img = new Image();
      img.src = src;
      img.onload = () =>  {
        counter++;
        if ((counter % 100) == 0) console.log(counter);
        classifier.addImage(img, src.split("/")[2]);
        resolve();
        img = null;
      };
      img.onerror = reject;
    });
  const loadTest = src =>
    new Promise((resolve, reject) => {
      let img = new Image();
      img.src = src;
      img.mask = src.split("/")[2];
      img.onload = () =>  {
        resolve(img);
        img = null
      };
      img.onerror = reject;
    })  
  ;
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  async function go() {
    let img_url = [];
  
    for(let i = 1; i <= 250; i++) {
        img_url.push("./archive/anger/img (" + i + ").png");
        img_url.push("./archive/happiness/img (" + i + ").png");
        img_url.push("./archive/sadness/img (" + i + ").png");
    }

    console.log("Comienzo de carga de imágenes");
    shuffleArray(img_url);
    let test_url = img_url.splice(Math.floor(img_url.length * 90 / 100), img_url.length);
  
    Promise.all(img_url.map(loadImage)).then(() => {
      console.log('Training.');
      classifier.train(lossValue => {
        if (lossValue)
          // training
          console.log(lossValue);
        }, finishedTraining(test_url));
    });
    img_url = null;
  }
  
  async function finishedTraining(test_url) {
    console.log(test_url);
    await Promise.all(test_url.map(loadTest)).then((images) => {
      document.addEventListener('keydown', async (event) => {
        let name = event.key;
        if (name == "n") {
          let results = [];
          let canvas = document.getElementById("canvas");
          for (let i = 0; i < images.length; i++) {
            canvas.getContext("2d").drawImage(images[i],0,0);
            await classifier.classify(images[i], (e,r) => {
              if (e)
                console.log(e);
              else {
                r.sort((a, b) => b.confidence - a.confidence);
                console.log(r);
                results.push([images[i].mask, r[0].label]);
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
            classifier.save();
        } else {
          console.log(name);
        }
      }, false);
      console.log("Añadido botones");
    });
    test_url = null;
  };

  document.addEventListener('keydown', (event) => {
    let name = event.key;
    if (name == "p") {
      console.log("go");
      go();
    }
  });
}

