/**
 * shorten-deck.cjs
 *
 * 1. Reads src/data/spanish/deck.json
 * 2. Removes all cards where target.split(/\s+/).length > 14
 * 3. Adds replacement short cards (all under 12 words) targeting the same grammar nodes
 * 4. Deduplicates by target (case-insensitive)
 * 5. Saves the updated deck and logs statistics
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');

// ---------------------------------------------------------------------------
// Replacement cards per grammar node
// ---------------------------------------------------------------------------

const replacements = {
  'node-01': [
    { target: 'Yo cocino pasta los viernes.', english: 'I cook pasta on Fridays.', tags: ['general'] },
    { target: 'Ella camina al parque cada mañana.', english: 'She walks to the park every morning.', tags: ['general', 'travel'] },
    { target: 'Nosotros comemos juntos los domingos.', english: 'We eat together on Sundays.', tags: ['general'] },
    { target: 'Tú lees muchos libros.', english: 'You read many books.', tags: ['general'] },
    { target: 'Él trabaja en un hospital.', english: 'He works in a hospital.', tags: ['general', 'work'] },
    { target: 'Mi madre prepara la cena.', english: 'My mother prepares dinner.', tags: ['general', 'family'] },
    { target: 'Los niños juegan en el jardín.', english: 'The children play in the garden.', tags: ['general', 'family'] },
    { target: 'Ella estudia español en línea.', english: 'She studies Spanish online.', tags: ['general'] },
    { target: 'Yo siempre desayuno temprano.', english: 'I always have breakfast early.', tags: ['general'] },
    { target: 'El perro duerme en el sofá.', english: 'The dog sleeps on the sofa.', tags: ['general', 'family'] },
    { target: 'Nosotros vivimos cerca de la playa.', english: 'We live near the beach.', tags: ['general', 'travel'] },
    { target: 'Mi hermano toca la guitarra.', english: 'My brother plays the guitar.', tags: ['general'] },
    { target: 'Ellos viajan mucho por trabajo.', english: 'They travel a lot for work.', tags: ['general', 'travel'] },
    { target: 'Yo abro la tienda a las nueve.', english: 'I open the shop at nine.', tags: ['general', 'work'] },
    { target: 'Ella enseña matemáticas en la escuela.', english: 'She teaches math at school.', tags: ['general', 'work'] },
    { target: 'Tú corres en el parque.', english: 'You run in the park.', tags: ['general'] },
    { target: 'Los gatos duermen todo el día.', english: 'Cats sleep all day.', tags: ['general'] },
    { target: 'Mi padre lee el periódico.', english: 'My father reads the newspaper.', tags: ['general', 'family'] },
    { target: 'Nosotros compartimos la cuenta.', english: 'We share the bill.', tags: ['general'] },
    { target: 'Ella escribe cartas a su abuela.', english: 'She writes letters to her grandmother.', tags: ['general', 'family'] },
    { target: 'Yo nado en la piscina los sábados.', english: 'I swim in the pool on Saturdays.', tags: ['general'] },
    { target: 'El tren sale a las ocho.', english: 'The train leaves at eight.', tags: ['general', 'travel'] },
    { target: 'Tú hablas muy bien español.', english: 'You speak Spanish very well.', tags: ['general'] },
    { target: 'Mi vecino tiene tres gatos.', english: 'My neighbor has three cats.', tags: ['general', 'family'] },
    { target: 'Nosotros compramos fruta fresca.', english: 'We buy fresh fruit.', tags: ['general', 'family'] },
    { target: 'Ella lleva a sus hijos al colegio.', english: 'She takes her children to school.', tags: ['general', 'family'] },
    { target: 'Yo escucho música para relajarme.', english: 'I listen to music to relax.', tags: ['general'] },
    { target: 'El café cierra a medianoche.', english: 'The café closes at midnight.', tags: ['general', 'travel'] },
    { target: 'Los pájaros cantan al amanecer.', english: 'The birds sing at dawn.', tags: ['general', 'travel'] },
    { target: 'Tú siempre llegas puntual.', english: 'You always arrive on time.', tags: ['general'] },
    { target: 'Mi jefe habla tres idiomas.', english: 'My boss speaks three languages.', tags: ['general', 'work'] },
    { target: 'Ella corre cinco kilómetros diarios.', english: 'She runs five kilometers daily.', tags: ['general'] },
    { target: 'Nosotros cenamos a las nueve.', english: 'We have dinner at nine.', tags: ['general'] },
    { target: 'El agua hierve a cien grados.', english: 'Water boils at a hundred degrees.', tags: ['general'] },
  ],

  'node-02': [
    { target: 'Mi padre es ingeniero muy dedicado.', english: 'My father is a very dedicated engineer.', tags: ['general', 'work', 'family'] },
    { target: 'La sopa está fría todavía.', english: 'The soup is still cold.', tags: ['general'] },
    { target: 'Ella es alta pero está cansada.', english: 'She is tall but she\'s tired.', tags: ['general'] },
  ],

  'node-04': [
    { target: 'Las flores del jardín son preciosas.', english: 'The flowers in the garden are beautiful.', tags: ['general', 'family'] },
  ],

  'node-05': [
    { target: 'A mis padres les encanta viajar.', english: 'My parents love to travel.', tags: ['general', 'family', 'travel'] },
    { target: 'Me molesta mucho el ruido.', english: 'Noise bothers me a lot.', tags: ['general'] },
    { target: '¿Te interesa la historia antigua?', english: 'Are you interested in ancient history?', tags: ['general'] },
  ],

  'node-06': [
    { target: 'Ayer compré pan en la panadería.', english: 'Yesterday I bought bread at the bakery.', tags: ['general'] },
    { target: 'Ella llegó tarde a la reunión.', english: 'She arrived late to the meeting.', tags: ['general', 'work'] },
    { target: 'Nosotros visitamos el museo ayer.', english: 'We visited the museum yesterday.', tags: ['general', 'travel'] },
    { target: 'Él perdió las llaves del coche.', english: 'He lost the car keys.', tags: ['general'] },
    { target: 'Yo encontré un billete en el suelo.', english: 'I found a ticket on the ground.', tags: ['general'] },
    { target: 'Ellos comieron paella en la playa.', english: 'They ate paella at the beach.', tags: ['general', 'travel'] },
    { target: 'Mi abuela nació en mil novecientos treinta.', english: 'My grandmother was born in 1930.', tags: ['general', 'family'] },
    { target: 'Tú ganaste el partido de tenis.', english: 'You won the tennis match.', tags: ['general'] },
    { target: 'Ella escribió una carta muy larga.', english: 'She wrote a very long letter.', tags: ['general'] },
    { target: 'Nosotros bailamos toda la noche.', english: 'We danced all night.', tags: ['general'] },
    { target: 'El vuelo salió con retraso.', english: 'The flight departed late.', tags: ['general', 'travel'] },
    { target: 'Yo aprendí a cocinar con mi madre.', english: 'I learned to cook with my mother.', tags: ['general', 'family'] },
    { target: 'Él pagó la cuenta del restaurante.', english: 'He paid the restaurant bill.', tags: ['general', 'travel'] },
    { target: 'Ellos se mudaron a otra ciudad.', english: 'They moved to another city.', tags: ['general'] },
    { target: 'Mi padre reparó la bicicleta.', english: 'My father fixed the bicycle.', tags: ['general', 'family'] },
    { target: 'Ella recibió una buena noticia.', english: 'She received good news.', tags: ['general'] },
    { target: 'Nosotros descubrimos un camino nuevo.', english: 'We discovered a new path.', tags: ['general', 'travel'] },
    { target: 'Yo hablé con el director ayer.', english: 'I spoke with the director yesterday.', tags: ['general', 'work'] },
    { target: 'El equipo ganó la copa.', english: 'The team won the cup.', tags: ['general'] },
    { target: 'Tú abriste la puerta demasiado rápido.', english: 'You opened the door too quickly.', tags: ['general'] },
    { target: 'Ella conoció a su esposo en la universidad.', english: 'She met her husband at university.', tags: ['general', 'family'] },
    { target: 'Ayer llovió durante toda la tarde.', english: 'Yesterday it rained all afternoon.', tags: ['general'] },
    { target: 'Él vendió su coche viejo.', english: 'He sold his old car.', tags: ['general'] },
    { target: 'Nosotros plantamos un árbol en el jardín.', english: 'We planted a tree in the garden.', tags: ['general', 'family'] },
    { target: 'Mi hijo sacó buenas notas.', english: 'My son got good grades.', tags: ['general', 'family'] },
    { target: 'Ella terminó el proyecto a tiempo.', english: 'She finished the project on time.', tags: ['general', 'work'] },
    { target: 'Yo perdí el autobús esta mañana.', english: 'I missed the bus this morning.', tags: ['general', 'travel'] },
    { target: 'Ellos construyeron una casa de madera.', english: 'They built a wooden house.', tags: ['general'] },
    { target: 'Tú olvidaste tu pasaporte en casa.', english: 'You forgot your passport at home.', tags: ['general', 'travel'] },
    { target: 'El volcán entró en erupción ayer.', english: 'The volcano erupted yesterday.', tags: ['general'] },
    { target: 'Ella pintó un cuadro muy bonito.', english: 'She painted a very pretty picture.', tags: ['general'] },
    { target: 'Nosotros reservamos una mesa para seis.', english: 'We reserved a table for six.', tags: ['general', 'travel'] },
    { target: 'Yo corrí diez kilómetros el domingo.', english: 'I ran ten kilometers on Sunday.', tags: ['general'] },
    { target: 'Él rompió el jarrón por accidente.', english: 'He broke the vase by accident.', tags: ['general', 'family'] },
    { target: 'La tormenta destruyó varios techos.', english: 'The storm destroyed several roofs.', tags: ['general'] },
  ],

  'node-07': [
    { target: 'Yo jugaba al fútbol de niño.', english: 'I used to play soccer as a child.', tags: ['general', 'family'] },
    { target: 'Ella siempre llegaba temprano.', english: 'She always arrived early.', tags: ['general', 'work'] },
    { target: 'Nosotros íbamos a la playa cada verano.', english: 'We went to the beach every summer.', tags: ['general', 'travel', 'family'] },
    { target: 'Mi abuela cocinaba los mejores postres.', english: 'My grandmother cooked the best desserts.', tags: ['general', 'family'] },
    { target: 'De pequeño, yo leía mucho.', english: 'As a child, I read a lot.', tags: ['general', 'family'] },
    { target: 'Ellos vivían en un pueblo pequeño.', english: 'They lived in a small town.', tags: ['general'] },
    { target: 'Mi padre trabajaba hasta muy tarde.', english: 'My father worked very late.', tags: ['general', 'work', 'family'] },
    { target: 'Tú siempre sonreías en las fotos.', english: 'You always smiled in photos.', tags: ['general', 'family'] },
    { target: 'Ella cantaba mientras limpiaba la casa.', english: 'She sang while cleaning the house.', tags: ['general', 'family'] },
    { target: 'Nosotros caminábamos al colegio juntos.', english: 'We walked to school together.', tags: ['general', 'family'] },
    { target: 'El parque tenía un lago pequeño.', english: 'The park had a small lake.', tags: ['general'] },
    { target: 'Yo soñaba con ser astronauta.', english: 'I dreamed of being an astronaut.', tags: ['general'] },
    { target: 'Los vecinos hacían fiestas cada mes.', english: 'The neighbors had parties every month.', tags: ['general'] },
    { target: 'Mi madre me contaba cuentos.', english: 'My mother used to tell me stories.', tags: ['general', 'family'] },
    { target: 'Antes llovía más en primavera.', english: 'Before it rained more in spring.', tags: ['general'] },
    { target: 'Ella dibujaba paisajes muy detallados.', english: 'She drew very detailed landscapes.', tags: ['general'] },
    { target: 'Nosotros compartíamos todo entre hermanos.', english: 'We shared everything among siblings.', tags: ['general', 'family'] },
    { target: 'Mi abuelo pescaba en el río.', english: 'My grandfather fished in the river.', tags: ['general', 'family'] },
  ],

  'node-08': [
    { target: 'Ella se levanta a las seis.', english: 'She gets up at six.', tags: ['general'] },
    { target: 'Me visto rápido por las mañanas.', english: 'I get dressed quickly in the mornings.', tags: ['general'] },
    { target: 'Nos sentamos cerca de la ventana.', english: 'We sat near the window.', tags: ['general'] },
    { target: 'Él se afeita cada mañana.', english: 'He shaves every morning.', tags: ['general'] },
    { target: 'Me acuesto temprano entre semana.', english: 'I go to bed early on weekdays.', tags: ['general'] },
    { target: 'Se ducharon después del partido.', english: 'They showered after the game.', tags: ['general'] },
  ],

  'node-09': [
    { target: 'Caminamos por el centro de la ciudad.', english: 'We walked through the city center.', tags: ['general', 'travel'] },
    { target: 'Este regalo es para tu cumpleaños.', english: 'This gift is for your birthday.', tags: ['general', 'family'] },
    { target: 'Estudia para ser médico.', english: 'He studies to become a doctor.', tags: ['general', 'work'] },
    { target: 'Pagué mucho por este billete.', english: 'I paid a lot for this ticket.', tags: ['general', 'travel'] },
  ],

  'node-10': [
    { target: '¿Me lo puedes repetir, por favor?', english: 'Can you repeat that to me, please?', tags: ['general'] },
    { target: 'Se lo dije ayer.', english: 'I told him yesterday.', tags: ['general'] },
    { target: 'Ella nos invitó a su fiesta.', english: 'She invited us to her party.', tags: ['general', 'family'] },
    { target: 'No te lo voy a prestar.', english: "I'm not going to lend it to you.", tags: ['general'] },
    { target: 'Le compré un regalo a mi madre.', english: 'I bought a gift for my mother.', tags: ['general', 'family'] },
  ],

  'node-11': [
    { target: 'Espero que tengas un buen día.', english: 'I hope you have a good day.', tags: ['general'] },
    { target: 'Dudo que él llegue a tiempo.', english: "I doubt he'll arrive on time.", tags: ['general'] },
    { target: 'Es importante que estudies más.', english: "It's important that you study more.", tags: ['general', 'work'] },
    { target: 'Quiero que vengas a mi fiesta.', english: 'I want you to come to my party.', tags: ['general', 'family'] },
    { target: 'No creo que llueva mañana.', english: "I don't think it'll rain tomorrow.", tags: ['general'] },
    { target: 'Es posible que cambie de opinión.', english: "It's possible he'll change his mind.", tags: ['general'] },
    { target: 'Ojalá que todo salga bien.', english: 'I hope everything goes well.', tags: ['general'] },
    { target: 'Me alegra que estés aquí.', english: "I'm glad you're here.", tags: ['general', 'family'] },
  ],

  'node-12': [
    { target: 'Cierra la puerta, por favor.', english: 'Close the door, please.', tags: ['general', 'family'] },
    { target: 'No toques eso, es peligroso.', english: "Don't touch that, it's dangerous.", tags: ['general', 'family'] },
  ],

  'node-13': [
    { target: 'Yo comería sushi esta noche.', english: 'I would eat sushi tonight.', tags: ['general', 'travel'] },
    { target: '¿Te gustaría ir al cine?', english: 'Would you like to go to the movies?', tags: ['general'] },
    { target: 'Ella podría ayudarnos con esto.', english: 'She could help us with this.', tags: ['general'] },
    { target: '¿Qué harías con un millón de euros?', english: 'What would you do with a million euros?', tags: ['general'] },
    { target: 'Me encantaría vivir en la playa.', english: 'I would love to live at the beach.', tags: ['general', 'travel'] },
    { target: 'Deberías descansar un poco más.', english: 'You should rest a bit more.', tags: ['general'] },
    { target: 'Nosotros preferiríamos salir más temprano.', english: 'We would prefer to leave earlier.', tags: ['general'] },
    { target: 'Él diría que es imposible.', english: 'He would say it\'s impossible.', tags: ['general', 'work'] },
  ],

  'node-14': [
    { target: 'Mañana iré al dentista.', english: "Tomorrow I'll go to the dentist.", tags: ['general'] },
    { target: 'Ella habrá terminado para las cinco.', english: 'She will have finished by five.', tags: ['general', 'work'] },
    { target: 'Nosotros viajaremos a Italia en julio.', english: 'We will travel to Italy in July.', tags: ['general', 'travel'] },
    { target: 'Ya he comido, gracias.', english: "I've already eaten, thanks.", tags: ['general'] },
    { target: 'El tren llegará a las tres.', english: 'The train will arrive at three.', tags: ['general', 'travel'] },
    { target: '¿Has estado alguna vez en Japón?', english: 'Have you ever been to Japan?', tags: ['general', 'travel'] },
    { target: 'Ella ha vivido en cinco países.', english: 'She has lived in five countries.', tags: ['general', 'travel'] },
    { target: 'Mañana lloverá todo el día.', english: 'Tomorrow it will rain all day.', tags: ['general'] },
    { target: 'Yo ya he terminado mi tarea.', english: "I've already finished my homework.", tags: ['general'] },
    { target: 'Él trabajará desde casa mañana.', english: 'He will work from home tomorrow.', tags: ['general', 'work'] },
    { target: 'Nosotros hemos comprado una casa nueva.', english: 'We have bought a new house.', tags: ['general', 'family'] },
    { target: '¿Cuándo vendrás a visitarnos?', english: 'When will you come visit us?', tags: ['general', 'family'] },
    { target: 'Ella habrá leído el libro para entonces.', english: 'She will have read the book by then.', tags: ['general'] },
    { target: 'El verano será muy caluroso.', english: 'The summer will be very hot.', tags: ['general'] },
    { target: 'Yo he aprendido mucho este año.', english: 'I have learned a lot this year.', tags: ['general', 'work'] },
    { target: 'Tú te arrepentirás de eso.', english: 'You will regret that.', tags: ['general'] },
    { target: 'Los precios subirán el mes que viene.', english: 'Prices will go up next month.', tags: ['general'] },
    { target: '¿Has visto mi teléfono?', english: 'Have you seen my phone?', tags: ['general'] },
    { target: 'Ella nunca ha probado el sushi.', english: 'She has never tried sushi.', tags: ['general', 'travel'] },
    { target: 'Mañana sabremos los resultados.', english: "Tomorrow we'll know the results.", tags: ['general', 'work'] },
    { target: 'Él ha perdido mucho peso.', english: 'He has lost a lot of weight.', tags: ['general'] },
    { target: 'Nosotros haremos una fiesta el sábado.', english: "We'll have a party on Saturday.", tags: ['general', 'family'] },
    { target: 'Ya ha salido el sol.', english: 'The sun has already come out.', tags: ['general'] },
    { target: 'Tú encontrarás un trabajo mejor.', english: 'You will find a better job.', tags: ['general', 'work'] },
    { target: 'Mi madre ha cocinado una paella.', english: 'My mother has made a paella.', tags: ['general', 'family'] },
    { target: 'El avión despegará en diez minutos.', english: 'The plane will take off in ten minutes.', tags: ['general', 'travel'] },
    { target: '¿Has hablado con tu hermano?', english: 'Have you talked to your brother?', tags: ['general', 'family'] },
    { target: 'Ella estudiará medicina el próximo año.', english: 'She will study medicine next year.', tags: ['general', 'work'] },
    { target: 'Yo habré ahorrado lo suficiente.', english: 'I will have saved enough.', tags: ['general'] },
    { target: 'Los niños crecerán muy rápido.', english: 'The children will grow very fast.', tags: ['general', 'family'] },
    { target: 'Hemos decidido mudarnos al campo.', english: 'We have decided to move to the countryside.', tags: ['general'] },
    { target: 'Él volverá la semana que viene.', english: 'He will come back next week.', tags: ['general'] },
    { target: '¿Cuánto costará el billete?', english: 'How much will the ticket cost?', tags: ['general', 'travel'] },
    { target: 'Ella ha escrito tres novelas.', english: 'She has written three novels.', tags: ['general', 'work'] },
    { target: 'Nosotros habremos llegado antes de las doce.', english: 'We will have arrived before twelve.', tags: ['general', 'travel'] },
    { target: 'El nuevo café abrirá pronto.', english: 'The new café will open soon.', tags: ['general', 'travel'] },
    { target: 'Tú has mejorado mucho este semestre.', english: 'You have improved a lot this semester.', tags: ['general', 'work'] },
    { target: 'Yo iré al gimnasio después del trabajo.', english: "I'll go to the gym after work.", tags: ['general', 'work'] },
    { target: 'Ella ya ha comprado los regalos.', english: 'She has already bought the gifts.', tags: ['general', 'family'] },
    { target: '¿Habrás terminado a tiempo?', english: 'Will you have finished on time?', tags: ['general', 'work'] },
    { target: 'Los invitados llegarán a las ocho.', english: 'The guests will arrive at eight.', tags: ['general', 'family'] },
    { target: 'He dormido muy mal esta noche.', english: 'I slept very poorly tonight.', tags: ['general'] },
    { target: 'Ellos construirán un nuevo hospital.', english: 'They will build a new hospital.', tags: ['general', 'work'] },
    { target: '¿Ya has probado la sopa?', english: 'Have you tried the soup yet?', tags: ['general'] },
    { target: 'Ella vivirá cerca del trabajo.', english: 'She will live near work.', tags: ['general', 'work'] },
    { target: 'Nosotros hemos pintado la habitación.', english: 'We have painted the room.', tags: ['general', 'family'] },
    { target: 'El sol se pondrá a las nueve.', english: 'The sun will set at nine.', tags: ['general'] },
    { target: 'Tú habrás olvidado todo para entonces.', english: 'You will have forgotten everything by then.', tags: ['general'] },
    { target: 'Mi hijo ha aprobado el examen.', english: 'My son has passed the exam.', tags: ['general', 'family'] },
    { target: 'La tienda cerrará a las diez.', english: 'The store will close at ten.', tags: ['general'] },
    { target: 'He pensado mucho en tu propuesta.', english: "I've thought a lot about your proposal.", tags: ['general', 'work'] },
    { target: 'Ella aprenderá a conducir este verano.', english: "She'll learn to drive this summer.", tags: ['general'] },
  ],

  'node-15': [
    { target: 'El libro que leí era fascinante.', english: 'The book I read was fascinating.', tags: ['general'] },
    { target: 'La ciudad donde nací es pequeña.', english: 'The city where I was born is small.', tags: ['general'] },
    { target: 'El hombre que trabaja aquí es amable.', english: 'The man who works here is kind.', tags: ['general', 'work'] },
    { target: 'La casa que compramos tiene jardín.', english: 'The house we bought has a garden.', tags: ['general', 'family'] },
    { target: 'El restaurante donde cenamos estaba lleno.', english: 'The restaurant where we dined was full.', tags: ['general', 'travel'] },
    { target: 'La persona a quien llamé no contestó.', english: "The person I called didn't answer.", tags: ['general'] },
    { target: 'El país donde viví era muy cálido.', english: 'The country where I lived was very warm.', tags: ['general', 'travel'] },
    { target: 'El perro que encontramos estaba perdido.', english: 'The dog we found was lost.', tags: ['general', 'family'] },
    { target: 'La tienda donde compro el pan cerró.', english: 'The shop where I buy bread closed.', tags: ['general'] },
    { target: 'El profesor que me enseñó era excelente.', english: 'The teacher who taught me was excellent.', tags: ['general', 'work'] },
    { target: 'La película que vimos fue divertida.', english: 'The movie we saw was funny.', tags: ['general'] },
    { target: 'El amigo con quien hablé me ayudó.', english: 'The friend I spoke with helped me.', tags: ['general', 'family'] },
    { target: 'La calle donde jugábamos era tranquila.', english: 'The street where we played was quiet.', tags: ['general', 'family'] },
    { target: 'El regalo que me dieron es perfecto.', english: 'The gift they gave me is perfect.', tags: ['general', 'family'] },
    { target: 'La mujer que conocí habla tres idiomas.', english: 'The woman I met speaks three languages.', tags: ['general'] },
    { target: 'El hotel donde nos quedamos era barato.', english: 'The hotel where we stayed was cheap.', tags: ['general', 'travel'] },
    { target: 'El coche que vendí era muy viejo.', english: 'The car I sold was very old.', tags: ['general'] },
    { target: 'La empresa donde trabajo es internacional.', english: 'The company where I work is international.', tags: ['general', 'work'] },
    { target: 'El parque que visitamos tenía un lago.', english: 'The park we visited had a lake.', tags: ['general', 'travel'] },
    { target: 'La receta que encontré es muy fácil.', english: 'The recipe I found is very easy.', tags: ['general', 'family'] },
    { target: 'El niño que juega ahí es mi sobrino.', english: 'The boy playing there is my nephew.', tags: ['general', 'family'] },
    { target: 'La playa donde fuimos era preciosa.', english: 'The beach where we went was beautiful.', tags: ['general', 'travel'] },
    { target: 'El tren que tomamos fue puntual.', english: 'The train we took was on time.', tags: ['general', 'travel'] },
    { target: 'La canción que escuchamos me gustó mucho.', english: 'I really liked the song we listened to.', tags: ['general'] },
    { target: 'El médico que me atendió fue amable.', english: 'The doctor who treated me was kind.', tags: ['general'] },
    { target: 'La carta que recibí traía buenas noticias.', english: 'The letter I received had good news.', tags: ['general'] },
    { target: 'El pueblo donde crecí ha cambiado mucho.', english: 'The town where I grew up has changed a lot.', tags: ['general'] },
  ],

  'node-16': [
    { target: 'Quería que me escucharas.', english: 'I wanted you to listen to me.', tags: ['general', 'family'] },
    { target: 'Si yo hablara chino, viajaría a Pekín.', english: "If I spoke Chinese, I'd travel to Beijing.", tags: ['general', 'travel'] },
    { target: 'Era necesario que estudiáramos más.', english: 'It was necessary for us to study more.', tags: ['general', 'work'] },
    { target: 'Le pedí que me ayudara.', english: 'I asked him to help me.', tags: ['general'] },
    { target: 'Buscaba un hotel que tuviera piscina.', english: 'I was looking for a hotel with a pool.', tags: ['general', 'travel'] },
  ],

  'node-17': [
    { target: 'Si hubiera llovido, nos habríamos quedado.', english: 'If it had rained, we would have stayed.', tags: ['general'] },
    { target: 'Habría ido si me hubieran invitado.', english: "I would have gone if they'd invited me.", tags: ['general', 'family'] },
    { target: 'Si hubieras venido, te habrías divertido.', english: "If you'd come, you would have had fun.", tags: ['general', 'family'] },
  ],

  'node-18': [
    { target: 'Se habla español en veinte países.', english: 'Spanish is spoken in twenty countries.', tags: ['general', 'travel'] },
    { target: 'Se buscan voluntarios para el verano.', english: 'Volunteers are sought for the summer.', tags: ['general', 'work'] },
    { target: 'Aquí se come muy bien.', english: 'You eat very well here.', tags: ['general', 'travel'] },
    { target: 'Se vende esta casa por buen precio.', english: 'This house is for sale at a good price.', tags: ['general', 'family'] },
  ],

  'node-19': [
    { target: 'Dado que llueve, nos quedamos aquí.', english: "Since it's raining, we're staying here.", tags: ['general'] },
    { target: 'Así como lo dijo, así se hizo.', english: 'As he said it, so it was done.', tags: ['general', 'work'] },
  ],

  'node-20': [
    { target: 'Si tuviera tiempo, viajaría más.', english: 'If I had time, I would travel more.', tags: ['general', 'travel'] },
    { target: 'Ojalá pudiera ir contigo.', english: 'I wish I could go with you.', tags: ['general'] },
    { target: 'Se rumorea que la empresa cerrará.', english: "It's rumored the company will close.", tags: ['general', 'work'] },
    { target: 'No obstante, seguimos adelante con el plan.', english: "However, we're moving forward with the plan.", tags: ['general', 'work'] },
    { target: 'Si hubiera estudiado más, habría aprobado.', english: 'If I had studied more, I would have passed.', tags: ['general'] },
    { target: 'Se dice que el café es beneficioso.', english: "It's said that coffee is beneficial.", tags: ['general'] },
    { target: 'A pesar de todo, no me rindo.', english: "Despite everything, I don't give up.", tags: ['general'] },
    { target: 'Fue construido en el siglo diecinueve.', english: 'It was built in the nineteenth century.', tags: ['general', 'travel'] },
    { target: 'Si fuera posible, me mudaría al campo.', english: "If it were possible, I'd move to the countryside.", tags: ['general'] },
    { target: 'No solo canta, sino que también baila.', english: 'Not only does she sing, but she also dances.', tags: ['general'] },
    { target: 'Se necesitan más voluntarios para el evento.', english: 'More volunteers are needed for the event.', tags: ['general', 'work'] },
    { target: 'Aunque lloviera, iríamos a la montaña.', english: "Even if it rained, we'd go to the mountain.", tags: ['general', 'travel'] },
    { target: 'Sin embargo, la decisión fue difícil.', english: 'However, the decision was difficult.', tags: ['general', 'work'] },
    { target: 'Si pudiera elegir, viviría junto al mar.', english: "If I could choose, I'd live by the sea.", tags: ['general'] },
    { target: 'Se espera que la situación mejore pronto.', english: "It's expected the situation will improve soon.", tags: ['general'] },
    { target: 'Ojalá me hubieran avisado antes.', english: 'I wish they had warned me before.', tags: ['general'] },
    { target: 'A pesar del frío, salimos a caminar.', english: 'Despite the cold, we went for a walk.', tags: ['general'] },
    { target: 'No obstante, el resultado fue positivo.', english: 'Nevertheless, the result was positive.', tags: ['general', 'work'] },
    { target: 'Se prohíbe fumar en este lugar.', english: 'Smoking is forbidden in this place.', tags: ['general'] },
    { target: 'Si yo fuera tú, aceptaría la oferta.', english: "If I were you, I'd accept the offer.", tags: ['general', 'work'] },
    { target: 'Fue inaugurado por el presidente mismo.', english: 'It was opened by the president himself.', tags: ['general'] },
    { target: 'Aunque no lo creas, es verdad.', english: "Even if you don't believe it, it's true.", tags: ['general'] },
    { target: 'Se recomienda reservar con antelación.', english: "It's recommended to book in advance.", tags: ['general', 'travel'] },
    { target: 'Si tuviera más dinero, compraría una casa.', english: "If I had more money, I'd buy a house.", tags: ['general', 'family'] },
    { target: 'No solo llegó tarde, sino mal preparado.', english: 'Not only did he arrive late, but poorly prepared.', tags: ['general', 'work'] },
    { target: 'A pesar de sus esfuerzos, no lo logró.', english: "Despite her efforts, she didn't succeed.", tags: ['general'] },
    { target: 'Si supiera la respuesta, te la diría.', english: "If I knew the answer, I'd tell you.", tags: ['general'] },
    { target: 'Fue traducido a más de veinte idiomas.', english: 'It was translated into more than twenty languages.', tags: ['general'] },
    { target: 'Sin embargo, nadie se quejó del cambio.', english: 'However, no one complained about the change.', tags: ['general'] },
    { target: 'Ojalá tuviéramos más vacaciones este año.', english: 'I wish we had more vacation this year.', tags: ['general', 'work'] },
    { target: 'Se comenta que habrá una nueva ley.', english: "It's said there will be a new law.", tags: ['general'] },
    { target: 'Si pudiera volver atrás, cambiaría algo.', english: "If I could go back, I'd change something.", tags: ['general'] },
    { target: 'A pesar del ruido, logré dormir bien.', english: 'Despite the noise, I managed to sleep well.', tags: ['general'] },
    { target: 'No solo es inteligente, sino también generosa.', english: 'Not only is she smart, but also generous.', tags: ['general', 'family'] },
    { target: 'El edificio fue demolido el año pasado.', english: 'The building was demolished last year.', tags: ['general'] },
    { target: 'Si hubiera sabido, habría venido antes.', english: 'If I had known, I would have come earlier.', tags: ['general'] },
    { target: 'Se requiere experiencia previa para este puesto.', english: 'Previous experience is required for this position.', tags: ['general', 'work'] },
    { target: 'Sin embargo, decidieron continuar con el proyecto.', english: 'However, they decided to continue with the project.', tags: ['general', 'work'] },
    { target: 'Si fuera más joven, aprendería otro idioma.', english: "If I were younger, I'd learn another language.", tags: ['general'] },
    { target: 'No obstante, el equipo logró sus metas.', english: 'Nevertheless, the team achieved its goals.', tags: ['general', 'work'] },
    { target: 'Se sabe que la vitamina C es importante.', english: "It's known that vitamin C is important.", tags: ['general'] },
    { target: 'Si tuviéramos coche, iríamos al campo.', english: "If we had a car, we'd go to the countryside.", tags: ['general', 'travel'] },
    { target: 'Fue premiado por su labor social.', english: 'He was awarded for his social work.', tags: ['general', 'work'] },
    { target: 'Ojalá pudiera cambiar el pasado.', english: 'I wish I could change the past.', tags: ['general'] },
    { target: 'A pesar de la distancia, nos vemos mucho.', english: 'Despite the distance, we see each other often.', tags: ['general', 'family'] },
    { target: 'Si me dieran la oportunidad, lo intentaría.', english: "If they gave me the chance, I'd try it.", tags: ['general', 'work'] },
    { target: 'No solo canta bien, sino que compone.', english: 'Not only does he sing well, but he composes.', tags: ['general'] },
    { target: 'Se encontraron restos arqueológicos en la zona.', english: 'Archaeological remains were found in the area.', tags: ['general', 'travel'] },
    { target: 'Si hubiera más tiempo, visitaríamos el museo.', english: "If there were more time, we'd visit the museum.", tags: ['general', 'travel'] },
    { target: 'Sin embargo, prefiero quedarme en casa hoy.', english: 'However, I prefer to stay home today.', tags: ['general', 'family'] },
    { target: 'Fue publicado en una revista internacional.', english: 'It was published in an international journal.', tags: ['general', 'work'] },
    { target: 'A pesar del resultado, estamos orgullosos.', english: 'Despite the result, we are proud.', tags: ['general', 'family'] },
    { target: 'Ojalá lloviera un poco más.', english: 'I wish it would rain a bit more.', tags: ['general'] },
    { target: 'Si pudiera cocinar como mi madre, sería feliz.', english: "If I could cook like my mom, I'd be happy.", tags: ['general', 'family'] },
    { target: 'Se cree que es la mejor opción.', english: "It's believed to be the best option.", tags: ['general'] },
    { target: 'No solo estudia, sino que también trabaja.', english: 'Not only does he study, but he also works.', tags: ['general', 'work'] },
  ],

  'node-21': [
    { target: 'Como si nada hubiera pasado, sonrió.', english: 'As if nothing had happened, she smiled.', tags: ['general'] },
  ],

  'node-22': [
    { target: 'Llevo tres años viviendo en Madrid.', english: "I've been living in Madrid for three years.", tags: ['general', 'travel'] },
    { target: 'Acabo de terminar el informe.', english: 'I just finished the report.', tags: ['general', 'work'] },
    { target: 'Ella se puso a llorar de repente.', english: 'She suddenly started crying.', tags: ['general', 'family'] },
    { target: 'Dejé de fumar hace un año.', english: 'I quit smoking a year ago.', tags: ['general'] },
    { target: 'Volvió a llamarme por la noche.', english: 'He called me again at night.', tags: ['general'] },
    { target: 'Sigue lloviendo desde la mañana.', english: "It's still raining since morning.", tags: ['general'] },
  ],

  'node-23': [
    { target: 'Dijo que vendría mañana por la tarde.', english: "He said he'd come tomorrow afternoon.", tags: ['general'] },
    { target: 'Me preguntó si tenía hambre.', english: 'She asked me if I was hungry.', tags: ['general', 'family'] },
    { target: 'Me pidió que cerrara la puerta.', english: 'She asked me to close the door.', tags: ['general'] },
    { target: 'Explicó que el tren se había retrasado.', english: 'He explained the train had been delayed.', tags: ['general', 'travel'] },
  ],

  'node-24': [
    { target: 'Cabe destacar su aporte a la ciencia.', english: 'It is worth noting his contribution to science.', tags: ['general', 'work'] },
  ],

  'node-25': [
    { target: 'No por mucho madrugar amanece más temprano.', english: "The early bird doesn't always catch the worm.", tags: ['general'] },
  ],

  'node-26': [
    { target: 'Dicho esto, pasemos al siguiente tema.', english: "That said, let's move to the next topic.", tags: ['general', 'work'] },
  ],
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Read deck
  const raw = fs.readFileSync(DECK_PATH, 'utf-8');
  const deck = JSON.parse(raw);
  const originalCount = deck.length;

  console.log(`Loaded deck with ${originalCount} cards.`);

  // Count cards per node before removal
  const beforePerNode = {};
  for (const card of deck) {
    const node = card.grammarNode || 'unknown';
    beforePerNode[node] = (beforePerNode[node] || 0) + 1;
  }

  // 2. Remove long cards (target > 14 words)
  const removedPerNode = {};
  const kept = [];
  for (const card of deck) {
    const wordCount = card.target.split(/\s+/).length;
    if (wordCount > 14) {
      const node = card.grammarNode || 'unknown';
      removedPerNode[node] = (removedPerNode[node] || 0) + 1;
    } else {
      kept.push(card);
    }
  }

  const totalRemoved = originalCount - kept.length;
  console.log(`\nRemoved ${totalRemoved} cards with > 14 words.`);
  console.log('Removed per node:');
  for (const [node, count] of Object.entries(removedPerNode).sort()) {
    console.log(`  ${node}: ${count} removed`);
  }

  // 3. Find max ID
  let maxId = 0;
  for (const card of kept) {
    if (card.id > maxId) maxId = card.id;
  }
  console.log(`\nMax existing ID after removal: ${maxId}`);

  // Build set of existing targets (lowercase) for deduplication
  const existingTargets = new Set();
  for (const card of kept) {
    existingTargets.add(card.target.toLowerCase());
  }

  // 4. Add replacement cards
  let nextId = maxId + 1;
  let totalAdded = 0;
  let totalSkipped = 0;
  const addedPerNode = {};

  for (const [node, cards] of Object.entries(replacements)) {
    let nodeAdded = 0;
    let nodeSkipped = 0;

    for (const card of cards) {
      // Deduplicate: skip if target already exists (case-insensitive)
      if (existingTargets.has(card.target.toLowerCase())) {
        nodeSkipped++;
        totalSkipped++;
        continue;
      }

      kept.push({
        id: nextId++,
        target: card.target,
        english: card.english,
        audio: '',
        tags: card.tags,
        grammarNode: node,
      });

      existingTargets.add(card.target.toLowerCase());
      nodeAdded++;
      totalAdded++;
    }

    addedPerNode[node] = { added: nodeAdded, skipped: nodeSkipped };
  }

  console.log(`\nAdded ${totalAdded} replacement cards (skipped ${totalSkipped} duplicates).`);
  console.log('Added per node:');
  for (const [node, { added, skipped }] of Object.entries(addedPerNode).sort()) {
    const suffix = skipped > 0 ? ` (${skipped} skipped as duplicates)` : '';
    console.log(`  ${node}: +${added}${suffix}`);
  }

  // 5. Count per node after changes
  const afterPerNode = {};
  for (const card of kept) {
    const node = card.grammarNode || 'unknown';
    afterPerNode[node] = (afterPerNode[node] || 0) + 1;
  }

  // Collect all nodes
  const allNodes = new Set([
    ...Object.keys(beforePerNode),
    ...Object.keys(afterPerNode),
  ]);

  console.log('\n--- Per-node summary (before -> after) ---');
  for (const node of [...allNodes].sort()) {
    const before = beforePerNode[node] || 0;
    const after = afterPerNode[node] || 0;
    const diff = after - before;
    const sign = diff >= 0 ? '+' : '';
    console.log(`  ${node}: ${before} -> ${after} (${sign}${diff})`);
  }

  // Per-goal summary
  const goals = ['general', 'travel', 'work', 'family'];
  console.log('\n--- Per-goal summary (before -> after) ---');
  for (const goal of goals) {
    const beforeGoal = deck.filter(c => c.tags && c.tags.includes(goal)).length;
    const afterGoal = kept.filter(c => c.tags && c.tags.includes(goal)).length;
    const diff = afterGoal - beforeGoal;
    const sign = diff >= 0 ? '+' : '';
    console.log(`  ${goal}: ${beforeGoal} -> ${afterGoal} (${sign}${diff})`);
  }

  console.log(`\nFinal deck size: ${kept.length} (was ${originalCount}, net ${kept.length - originalCount >= 0 ? '+' : ''}${kept.length - originalCount})`);

  // 6. Save
  fs.writeFileSync(DECK_PATH, JSON.stringify(kept, null, 2) + '\n', 'utf-8');
  console.log(`\nSaved to ${DECK_PATH}`);
}

main();
