//esto esta asi para que en cuanto se incie la pagina se carguen las funciones
document.addEventListener('DOMContentLoaded', () => 
{

    //dinero que tiene la maquina 
    let credito = 0;

    //aqui guardo la palabra antes de procesarla com si fuera un buffer 
    let codigoIngresado = '';
    //para rastrear si la palabra es valida
    let estadoAutomata = ''; 

    let historialAcciones = []; //La palabra que se va armando
    
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
        btnIniciar: document.getElementById('btn-iniciar'), 
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
        for (let i = 1; i <= 5; i++) //filas
        { 
            for (let j = 1; j <= 5; j++) //columnas
            { 
                const productCode = `${i}${j}`;
                const precioProducto = Math.floor(Math.random() * 13) + 3;
                precios[productCode] = precioProducto;
                const candy = document.createElement('div');
                candy.className = 'candy';
                candy.id = `candy-${productCode}`;
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
            btn.addEventListener('click', () => agregarAPalabra('DIGITO', i)); 
            dom.keypad.appendChild(btn);
        }
        //cree el boton 0 fuera del loop
        const btn0 = document.createElement('button');
        btn0.textContent = 0;
        btn0.addEventListener('click', () => agregarAPalabra('DIGITO', 0));
        dom.keypad.appendChild(btn0);
    }

    //esto arma la palabra no ejecuta nada
    function agregarAPalabra(tipo, valor)
    {
        let comando;
        if (tipo === 'MONEDA')
        { 
            comando = `$${valor}`;
        }
        else if (tipo === 'DIGITO') 
        {
            comando = `${valor}`;
        }
        else 
        {
            comando = tipo;
        }  
        
        historialAcciones.push(comando);
        actualizarHistorial();
    }


    //se actualiza la palabra que vamos formando en el automata
    function actualizarHistorial() 
    {
        dom.palabraDisplay.textContent = JSON.stringify(historialAcciones);
    }

    //una funcion para reiniciar las palabras manualmente
    function reiniciarHistorial() 
    {
        historialAcciones = [];
        actualizarHistorial(); 
    }

    
    //funcion que lee la pablara que se inicia con el boton iniciar
    async function probarSecuencia()
    {
        //inicia reinciiadno el automata excepto el dinero para que se pueda devolver en cualquier momento su cambio exacto
        codigoIngresado = '';
        estadoAutomata = 'x';
        dom.dispenseBin.textContent = '';
        actualizarVisualizacion();
        await sleep(500);

        //analiza la palabra incersion por incercion
        for (const palabra of historialAcciones)
        {
            //si el paso anterior le regreso error o valido se crota
            if(estadoAutomata === 'ERROR'||estadoAutomata==='VALIDO')
            {
                break;
            }


            //se lee el la palabra actial
            await ejecutarComando(palabra);
            actualizarVisualizacion();
            await sleep(1000); 
        }

        // al final se meustra en la maquina expendedora si se acepto la palabra omno
        if (estadoAutomata === 'ERROR')
        {
            dom.machineDisplay.textContent = 'SECUENCIA RECHAZADA';
        }
        else
        {
            dom.machineDisplay.textContent = 'SECUENCIA ACEPTADA';
        }
        
        //aqui solo limpia para el siguinte analizis que se vaya a hacer
        historialAcciones = [];
    }

    //lee la palabra actual ve que rollo con ella
    async function ejecutarComando(comando)
    {


        let valor = 0;

        //se muestra en la maquina expendedora cuando dinero metiste
        if (comando.startsWith('$')) 
        {
            valor = parseInt(comando.substring(1));
            credito += valor;
            dom.dispenseBin.textContent = `+ $${valor}`;
            
        } 
        //te devuelve el dinero
        else if (comando === 'DEVOLVER') 
        {
            if (credito > 0) 
            {
                await animarDevolucion(`Devolviendo $${credito}...`);
                credito = 0;
            }
            codigoIngresado = '';
            estadoAutomata='VALIDO'
        } 
        //analisis de digitos
        else 
        {
            //si es el primer digito ingresado solo se anade a codifoIngresado
            valor = parseInt(comando);
            if (codigoIngresado.length < 2) 
            {
                codigoIngresado += valor;
            }

            //si la palabra a formar ya tienen 2 numero se llama a la funcion intentarCompra
            if (codigoIngresado.length === 2) 
            {

                await intentarCompra(codigoIngresado);
                codigoIngresado = ''; 
            }
        }
    }
    
    //logica para la comra
    async function intentarCompra(codigo) 
    {
        const costo = precios[codigo];

        if (costo === undefined) 
        {
            dom.machineDisplay.textContent = `Código ${codigo} no existe.`;
            await sleep(1500);
            estadoAutomata = 'ERROR'; 
            return;
        }

        if (credito >= costo) 
        {
            credito -= costo;
            estadoAutomata = 'VALIDO';
            await animarDispensa(codigo, costo);
        } 
        else 
        {
            dom.machineDisplay.textContent = `Crédito insuficiente: $${credito}`;
            await sleep(1500);
            estadoAutomata = 'ERROR';
        }
    }

    //pura anicmacion que claramente yo hice XD
    function actualizarVisualizacion() 
    {
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

    async function animarDispensa(productCode, costo) 
    {

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
        sourceCandy.style.opacity = 1; 
    }

    async function animarDevolucion(mensaje) 
    {
        dom.machineDisplay.textContent = mensaje;
        dom.coinReturn.classList.add('returning-coins');
        await sleep(1500);
        dom.coinReturn.classList.remove('returning-coins');
    }

    


    dom.btnMoneda1.addEventListener('click', () => agregarAPalabra('MONEDA', 1));
    dom.btnMoneda2.addEventListener('click', () => agregarAPalabra('MONEDA', 2));
    dom.btnMoneda5.addEventListener('click', () => agregarAPalabra('MONEDA', 5));
    dom.btnMoneda10.addEventListener('click', () => agregarAPalabra('MONEDA', 10));
    dom.btnDevolver.addEventListener('click', () => agregarAPalabra('DEVOLVER'));
    dom.btnReiniciarSecuencia.addEventListener('click', reiniciarHistorial);
    dom.btnIniciar.addEventListener('click', probarSecuencia);
    

    generarControles(); //la generacion del padkey y la maquina expendedora
    actualizarVisualizacion(); //se carga por primera vez
    actualizarHistorial(); //se inicia la palabra con []
});