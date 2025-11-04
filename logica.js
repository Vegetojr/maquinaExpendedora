//esto esta asi para que en cuanto se incie la pagina se carguen las funciones
document.addEventListener('DOMContentLoaded', () => 
{

    //dinero que tiene la maquina
    let credito = 0;
    
    //aqui guardo la palabra antes de procesarla com si fuera un buffer 
    let codigoIngresado = '';

    let historialAcciones = []; //La palabra que se va armando
    let transaccionTerminada = true; //Para saber cuándo limpiar el historial

    //donde se guardanara los precios de los productos
    const precios = {};

    //esta variable es la que almacena todos los elementos del html para su facil accesso
    const dom = 
    {
        btnMoneda1: document.getElementById('btn-moneda-1'),
        btnMoneda2: document.getElementById('btn-moneda-2'),
        btnMoneda5: document.getElementById('btn-moneda-5'),
        btnMoneda10: document.getElementById('btn-moneda-10'),
        btnDevolver: document.getElementById('btn-devolver'),
        keypad: document.getElementById('keypad'),
        glassPanel: document.getElementById('glass-panel'),
        machineDisplay: document.getElementById('machine-display'),
        light: document.getElementById('coin-slot-light'),
        dispenseBin: document.getElementById('dispense-bin'),
        coinReturn: document.getElementById('coin-return'),
        palabraDisplay: document.getElementById('palabra-display'),
        btnReiniciarSecuencia: document.getElementById('btn-reiniciar-secuencia')
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    //se genera el keypad del 1 al 9 y la maquina expendedora con sus dulces
    function generarControles() 
    {
        //se caraga la maquina expendedora
        dom.glassPanel.innerHTML = '';
        for (let i = 1; i <= 5; i++) { //filas
            for (let j = 1; j <= 5; j++) 
            { //columnas
                const productCode = `${i}${j}`;
                
                //se leadigna un precio al producto 
                const precioProducto = Math.floor(Math.random() * 13) + 3;
                precios[productCode] = precioProducto;

                //aqui se le asigna el como id su candy-codigo 
                const candy = document.createElement('div');
                candy.className = 'candy';
                candy.id = `candy-${productCode}`;
                
                //dentro de su caja se muetra el codigo del producto y su precio
                candy.innerHTML = `${productCode} <span class="price">$${precioProducto}</span>`;
                dom.glassPanel.appendChild(candy);
            }
        }
        
        //se genera el teclado numerico
        dom.keypad.innerHTML = '';
        // Botones 1-9
        for (let i = 1; i <= 9; i++) 
        {
            const btn = document.createElement('button');
            btn.textContent = i;
            // Cada botón llama a procesarComando inmediatamente
            btn.addEventListener('click', () => procesarComando('DIGITO', i)); 
            dom.keypad.appendChild(btn);
        }
        //cree el boton 0 fuera del loop
        const btn0 = document.createElement('button');
        btn0.textContent = 0;
        btn0.addEventListener('click', () => procesarComando('DIGITO', 0));
        dom.keypad.appendChild(btn0);
    }

    //se actualiza la palabra que vamos formando en el automata
    function actualizarHistorial() 
    {
        dom.palabraDisplay.textContent = JSON.stringify(historialAcciones);
    }

    //una funcion para reiniciar las palabras manualmente y automaticamente
    function reiniciarHistorial() 
    {
        historialAcciones = [];
        transaccionTerminada = true;
        actualizarHistorial(); 
    }

    //en esta funcion el tipo es (dinero,posicon,devolver) y el valor es un numero
    async function procesarComando(tipo, valor) 
    {
        //Este if primero es mejor explicado con un ejemplo asi que leeanlo XD
        //supongamos que le meti 10 pesos y compre el 55. en la palabra apareceria [$10,5,5] y como la palabra fue aceptada transaccionTerminada es true
        //Al iniciar otra compra. Digamos que quiero meter otros 10 pesos. entonces entra a este if limpia historialAcciones e indica transaccionTerminada como false para indicar que estamos en una nueva palabra
        //y ya sigue con el resto de la funcion
        if (transaccionTerminada) 
        {
            historialAcciones = [];
            transaccionTerminada = false; 
        }

        //logica de como se va armando la palabra
        let comando;
        if (tipo === 'MONEDA')
        { 
            comando = `$${valor}`;//dinero
            credito += valor;
            dom.dispenseBin.textContent = `+ $${valor}`;
        }
        else if (tipo === 'DIGITO') 
        {
            comando = `${valor}`;//posicion
            //esto es el numero de posicion que se pone ya que llegue a 2 numeros dentro de la variable puede entrar el if que esta abajo para intentar hacer la compra 
            if (codigoIngresado.length < 2) 
            {
                codigoIngresado += valor;
            }
        }
        else 
        {
            comando = tipo;//Devolver
            if (credito > 0) 
            {
                await animarDevolucion(`Devolviendo $${credito}...`);
                credito = 0;
            }
            //el buffer se limpia
            codigoIngresado = '';
            transaccionTerminada = true; //y se indica que la palabra fue aceptda
        }  
        //se mete a historialAcciones
        historialAcciones.push(comando);
        actualizarHistorial(); // Actualiza el display de la palabra
        actualizarVisualizacion();//

        if (codigoIngresado.length === 2) 
        {
            await intentarCompra(codigoIngresado);
            codigoIngresado = '';
            transaccionTerminada = true; 
            actualizarVisualizacion();
        }
    }
    
    // Lógica para manejar una compra una vez que el código está completo
    async function intentarCompra(codigo) {
        const costo = precios[codigo];

        if (costo === undefined) {
            dom.machineDisplay.textContent = `Código ${codigo} no existe.`;
            await sleep(1500);
            return;
        }

        if (credito >= costo) {
            credito -= costo;
            await animarDispensa(codigo, costo);
        } else {
            dom.machineDisplay.textContent = `Crédito insuficiente: $${credito}`;
            await sleep(1500);
        }
    }

    //pura anicmacion que claramente yo hice XD
    function actualizarVisualizacion() {
        dom.light.className = credito > 0 ? 'luz-activa' : 'luz-inactiva';

        if (codigoIngresado.length === 0) {
            dom.machineDisplay.textContent = `Crédito: $${credito}`;
        } else {
            const costo = precios[codigoIngresado];
            if (codigoIngresado.length === 2 && costo !== undefined) 
            {
                dom.machineDisplay.textContent = `P ${codigoIngresado} - Costo: $${costo}`;
            } 
            else 
            {
                dom.machineDisplay.textContent = `Código: ${codigoIngresado}_`;
            }
        }
    }

    async function animarDispensa(productCode, costo) {
        dom.machineDisplay.textContent = `Dispensando ${productCode}...`;
        const sourceCandy = document.getElementById(`candy-${productCode}`);
        if (!sourceCandy) return;

        sourceCandy.style.opacity = 0;
        const fallingCandy = sourceCandy.cloneNode(true);
        fallingCandy.classList.add('falling-candy');
        
        const startRect = sourceCandy.getBoundingClientRect();
        const binRect = dom.dispenseBin.getBoundingClientRect();

        document.body.appendChild(fallingCandy);
        fallingCandy.style.left = `${startRect.left}px`;
        fallingCandy.style.top = `${startRect.top}px`;
        fallingCandy.style.width = `${startRect.width}px`;
        fallingCandy.style.height = `${startRect.height}px`;
        fallingCandy.style.opacity = 1;
        fallingCandy.style.transform = '';

        await sleep(20);

        fallingCandy.style.transform = `translateY(${binRect.top - startRect.top}px)`;
        fallingCandy.style.opacity = 0;

        await sleep(1000);
        
        dom.dispenseBin.textContent = `¡Gracias! (-$${costo})`;
        fallingCandy.remove();
        // Hacemos que el dulce reaparezca (stock infinito)
        sourceCandy.style.opacity = 1; 
    }

    async function animarDevolucion(mensaje) {
        dom.machineDisplay.textContent = mensaje;
        dom.coinReturn.classList.add('returning-coins');
        await sleep(1500);
        dom.coinReturn.classList.remove('returning-coins');
    }

    
    dom.btnMoneda1.addEventListener('click', () => procesarComando('MONEDA', 1)); //'moneda' es el tipo y el numreo pues el valor
    dom.btnMoneda2.addEventListener('click', () => procesarComando('MONEDA', 2));
    dom.btnMoneda5.addEventListener('click', () => procesarComando('MONEDA', 5));
    dom.btnMoneda10.addEventListener('click', () => procesarComando('MONEDA', 10));
    dom.btnDevolver.addEventListener('click', () => procesarComando('DEVOLVER')); // y como devolver solo tiene tipo pero no tiene valor pues no se le pasa nada
    dom.btnReiniciarSecuencia.addEventListener('click', reiniciarHistorial);
    

    generarControles(); //la generacion del padkey y la maquina expendedora
    actualizarVisualizacion(); //se carga por primera vez
    actualizarHistorial(); //se inicia la palabra con []
});