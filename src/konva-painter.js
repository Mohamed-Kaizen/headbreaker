let Konva;
try {
  // @ts-ignore
  Konva = require('konva');
} catch (e) {
  Konva = {
    Stage: class {
      constructor(_options) {
        throw new Error("Konva not loaded");
      }
    }
  };
}

const Canvas = require('./canvas');
const Outline = require('./outline');
const Piece = require('./piece');
const Vector = require('./vector');


/**
 * @param {Piece} model
 * @param {*} group
 */
function currentPositionDiff(model, group) {
  return Vector.diff(group.x(),group.y(), model.metadata.currentPosition.x, model.metadata.currentPosition.y);
}

/**
 * A {@link Painter} that uses Konva
 * @implements {Painter}
 */
class KonvaPainter {
  /** @typedef {import('./canvas').Figure} Figure */
  /** @typedef {import('./canvas').Group} Group */

  /**
   * @param {Canvas} canvas
   * @param {string} id
   */
  initialize(canvas, id) {
    var stage = new Konva.Stage({
      container: id,
      width: canvas.width,
      height: canvas.height
    });

    var layer = new Konva.Layer();
    stage.add(layer);
    canvas['__konvaLayer__'] = layer;
  }

  /**
   * @param {Canvas} canvas
   */
  draw(canvas) {
    canvas['__konvaLayer__'].draw();
  }

  /**
   *
   * @param {Canvas} canvas
   * @param {Piece} piece
   * @param {Figure} figure
   */
  sketch(canvas, piece, figure) {
    figure.group = new Konva.Group({
      x: piece.metadata.currentPosition.x,
      y: piece.metadata.currentPosition.y
    });

    const image = canvas._imageMetadataFor(piece);
    figure.shape = new Konva.Line({
      points: Outline.draw(piece, canvas.pieceSize, canvas.borderFill),
      fill: !image ? piece.metadata.color || 'black' : null,
      fillPatternImage: image && image.content,
      fillPatternScale: image && {x: image.scale, y: image.scale},
      fillPatternOffset: image && image.offset,
      tension: canvas.lineSoftness,
      stroke: piece.metadata.strokeColor || canvas.strokeColor,
      strokeWidth: canvas.strokeWidth,
      closed: true,
    });
    figure.group.add(figure.shape);
    figure.group.draggable('true');

    canvas['__konvaLayer__'].add(figure.group);
  }

  /**
   *
   * @param {Canvas} _canvas
   * @param {Piece} piece
   * @param {Figure} figure
   */
  label(_canvas, piece, figure) {
    figure.label = new Konva.Text({
      x: piece.metadata.label.x || (figure.group.width() / 2),
      y: piece.metadata.label.y || (figure.group.height() / 2),
      text:     piece.metadata.label.text,
      fontSize: piece.metadata.label.fontSize,
      fontFamily: piece.metadata.label.fontFamily || 'Sans Serif',
      fill: piece.metadata.label.color || 'white',
    });
    figure.group.add(figure.label);
  }

  /**
   *
   * @param {Canvas} _canvas
   * @param {Group} group
   * @param {Piece} piece
   */
  physicalTranslate(_canvas, group, piece) {
    group.x(piece.centralAnchor.x);
    group.y(piece.centralAnchor.y);
  }

  /**
   * @param {Canvas} _canvas
   * @param {Piece} piece
   * @param {*} group
   */
  logicalTranslate(_canvas, piece, group) {
    piece.metadata.currentPosition.x = group.x();
    piece.metadata.currentPosition.y = group.y();
  }

  /**
   * @param {Canvas} _canvas
   * @param {Piece} piece
   * @param {Group} group
   * @param {import('./canvas').VectorAction} f
   */
  onDrag(_canvas, piece, group, f) {
    group.on('mouseover', () => {
      document.body.style.cursor = 'pointer';
    });
    group.on('mouseout', () => {
      document.body.style.cursor = 'default';
    });
    group.on('dragmove', () => {
      let [dx, dy] = currentPositionDiff(piece, group);
      f(dx, dy);
    });
  }

  /**
   * @param {Canvas} _canvas
   * @param {Piece} _piece
   * @param {Group} group
   * @param {import('./canvas').Action} f
   */
  onDragEnd(_canvas, _piece, group, f) {
    group.on('dragend', () => {
      f()
    });
  }
}

/**
 * A {@link Painter} that uses Konvajs as rendering backend
 *
 * @module KonvaPainter
 */
module.exports = KonvaPainter;
