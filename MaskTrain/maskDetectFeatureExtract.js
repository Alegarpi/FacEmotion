// Transfer Learning method
const model = ml5.featureExtractor('MobileNet', modelLoaded);

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
        console.log(counter);
        classifier.addImage(img, src.split("/")[2]);
        resolve();
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
    console.log("Comienzo de carga de imágenes");
    let test_url = img_url.splice(Math.floor(img_url.length * 85 / 100), img_url.length);
  
    shuffleArray(img_url);
    Promise.all(img_url.map(loadImage)).then(() => {
      console.log('Training.');
      classifier.train(lossValue => {
        if (lossValue)
          // training
          console.log(lossValue);
        }, finishedTraining(test_url));
    });
  }
  
  async function finishedTraining(test_url) {
    console.log(test_url);
    await Promise.all(test_url.map(loadTest)).then((images) => {
      document.addEventListener('keydown', async (event) => {
        let name = event.key;
        // When n is pressed, testing starts and images are shown
        if (name == "n") {
          let results = [];
          let canvas = document.getElementById("canvas");
          canvas.height = 128;
          canvas.width = 128;
          for (let i = 0; i < images.length; i++) {
            canvas.getContext("2d").drawImage(images[i],0,0);
            await classifier.classify(images[i], (e,r) => {
              if (e)
                console.log(e);
              else {
                r.sort((a, b) => b.confidence - a.confidence);
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
          // Saves the model on Downloads folder
        } else if(name == "s") {
            classifier.save();
        } else {
          console.log(name);
        }
      }, false);
      console.log("Añadido botones");
    });
  }
  
  go();
  
}
