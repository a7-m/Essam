/**
 * =====================================================
 * Quiz Question Renderer Component
 * منصة الأستاذ عصام عبدالمنعم التعليمية
 * =====================================================
 */

class QuizRenderer {
  constructor() {
    this.dragState = {
      draggedElement: null,
      sourceContainer: null,
    };
  }

  /**
   * Render question based on type
   */
  renderQuestion(question, index, onAnswerChange) {
    const container = document.createElement('div');
    container.className = 'question-card';
    container.id = `q-card-${index}`;
    
    if (index === 0) container.classList.add('active');

    // Question header
    let html = `<h3 class="mb-4">${index + 1}. ${question.text}</h3>`;

    // Show image if exists
    if (question.media_url) {
      html += `<div class="question-media mb-3">
        <img src="${question.media_url}" alt="Question image" style="max-width: 100%; border-radius: var(--radius-md);">
      </div>`;
    }

    // Show hint if exists
    if (question.hint) {
      html += `<div class="question-hint mb-3">
        <button class="btn btn-sm btn-outline" onclick="toggleHint(${index})">
          💡 عرض تلميح
        </button>
        <div id="hint-${index}" class="hint-content d-none mt-2 p-3 bg-tertiary rounded">
          ${question.hint}
        </div>
      </div>`;
    }

    container.innerHTML = html;

    // Render based on type
    switch (question.type) {
      case 'mcq':
        container.appendChild(this.renderMCQ(question, index, onAnswerChange));
        break;
      case 'true_false':
        container.appendChild(this.renderTrueFalse(question, index, onAnswerChange));
        break;
      case 'essay':
        container.appendChild(this.renderEssay(question, index, onAnswerChange));
        break;
      case 'ordering':
        container.appendChild(this.renderOrdering(question, index, onAnswerChange));
        break;
      case 'matching':
        container.appendChild(this.renderMatching(question, index, onAnswerChange));
        break;
      case 'fill_blank':
        container.appendChild(this.renderFillBlank(question, index, onAnswerChange));
        break;
      case 'drag_drop':
        container.appendChild(this.renderDragDrop(question, index, onAnswerChange));
        break;
      default:
        container.appendChild(this.renderUnsupported(question.type));
    }

    return container;
  }

  /**
   * Render Multiple Choice Question
   */
  renderMCQ(question, index, onAnswerChange) {
    const div = document.createElement('div');
    div.className = 'options-list';
    
    div.innerHTML = question.options.map((opt, optIdx) => `
      <div class="option-item" data-value="${opt}" onclick="selectOption(${index}, '${question.id}', '${opt.replace(/'/g, "\\'")}', this)">
        <div class="option-radio"></div>
        <span>${opt}</span>
      </div>
    `).join('');

    return div;
  }

  /**
   * Render True/False Question
   */
  renderTrueFalse(question, index, onAnswerChange) {
    const div = document.createElement('div');
    div.className = 'options-list';
    
    div.innerHTML = `
      <div class="option-item" onclick="selectOption(${index}, '${question.id}', 'true', this)">
        <div class="option-radio"></div>
        <span>صح</span>
      </div>
      <div class="option-item" onclick="selectOption(${index}, '${question.id}', 'false', this)">
        <div class="option-radio"></div>
        <span>خطأ</span>
      </div>
    `;

    return div;
  }

  /**
   * Render Essay Question
   */
  renderEssay(question, index, onAnswerChange) {
    const div = document.createElement('div');
    div.innerHTML = `
      <textarea 
        class="form-control mt-3" 
        rows="6" 
        placeholder="اكتب إجابتك هنا..."
        onchange="selectOption(${index}, '${question.id}', this.value)"
      ></textarea>
    `;
    return div;
  }

  /**
   * Render Ordering Question (Drag to reorder)
   */
  renderOrdering(question, index, onAnswerChange) {
    const div = document.createElement('div');
    div.className = 'ordering-container mt-3';
    div.innerHTML = `
      <p class="text-secondary mb-3">رتب العناصر التالية بترتيبها الصحيح (اسحب وأفلت)</p>
      <div class="ordering-list" id="ordering-${index}">
        ${question.data.items.map((item, i) => `
          <div class="ordering-item" draggable="true" data-item-id="${i}">
            <span class="drag-handle">⋮⋮</span>
            <span class="item-text">${item}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Setup drag and drop after render
    setTimeout(() => this.setupOrderingDragDrop(index, question.id, onAnswerChange), 0);

    return div;
  }

  /**
   * Setup drag and drop for ordering questions
   */
  setupOrderingDragDrop(index, questionId, onAnswerChange) {
    const list = document.getElementById(`ordering-${index}`);
    if (!list) return;

    const items = list.querySelectorAll('.ordering-item');
    let draggedItem = null;

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
        
        // Collect order and save answer
        const currentOrder = Array.from(list.children).map(el => 
          parseInt(el.getAttribute('data-item-id'))
        );
        onAnswerChange(questionId, currentOrder, index);
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
          list.appendChild(draggedItem);
        } else {
          list.insertBefore(draggedItem, afterElement);
        }
      });
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ordering-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /**
   * Render Matching Question
   */
  renderMatching(question, index, onAnswerChange) {
    const div = document.createElement('div');
    div.className = 'matching-container mt-3';

    const leftItems = question.data.left_items;
    const rightItems = question.data.right_items;

    div.innerHTML = `
      <p class="text-secondary mb-3">طابق بين العناصر في العمودين</p>
      <div class="matching-grid">
        <div class="matching-column">
          ${leftItems.map((item, i) => `
            <div class="matching-item-left" data-left-id="${i}">
              <span>${item}</span>
            </div>
          `).join('')}
        </div>
        <div class="matching-column">
          ${leftItems.map((_, i) => `
            <div class="matching-select">
              <select class="form-control" onchange="updateMatching(${index}, '${question.id}', ${i}, this.value)">
                <option value="">-- اختر --</option>
                ${rightItems.map((rightItem, j) => `
                  <option value="${j}">${rightItem}</option>
                `).join('')}
              </select>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    return div;
  }

  /**
   * Render Fill in the Blank Question
   */
  renderFillBlank(question, index, onAnswerChange) {
    const div = document.createElement('div');
    div.className = 'fill-blank-container mt-3';

    // Replace {{blank}} markers with input fields
    let text = question.data.text_with_blanks;
    let blankIndex = 0;
    
    const html = text.replace(/{{blank}}/g, () => {
      const currentIndex = blankIndex++;
      return `<input 
        type="text" 
        class="blank-input" 
        data-blank-index="${currentIndex}"
        placeholder="___"
        onchange="updateFillBlank(${index}, '${question.id}')"
      />`;
    });

    div.innerHTML = `<div class="fill-blank-text">${html}</div>`;

    return div;
  }

  /**
   * Render Drag and Drop Question
   */
  renderDragDrop(question, index, onAnswerChange) {
    const div = document.createElement('div');
    div.className = 'drag-drop-container mt-3';

    const items = question.data.items;
    const zones = question.data.zones;

    div.innerHTML = `
      <p class="text-secondary mb-3">اسحب العناصر إلى المناطق الصحيحة</p>
      <div class="drag-drop-items mb-3" id="items-bank-${index}">
        ${items.map((item, i) => `
          <div class="draggable-item" draggable="true" data-item-id="${i}">
            ${item}
          </div>
        `).join('')}
      </div>
      <div class="drop-zones">
        ${zones.map((zone, zi) => `
          <div class="drop-zone" data-zone-id="${zi}">
            <div class="zone-label">${zone}</div>
            <div class="zone-content" id="zone-${index}-${zi}"></div>
          </div>
        `).join('')}
      </div>
    `;

    setTimeout(() => this.setupDragDropInteraction(index, question.id, onAnswerChange), 0);

    return div;
  }

  /**
   * Setup drag and drop interaction
   */
  setupDragDropInteraction(index, questionId, onAnswerChange) {
    const container = document.querySelector(`#items-bank-${index}`).parentElement;
    const items = container.querySelectorAll('.draggable-item');
    const zones = container.querySelectorAll('.zone-content');

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.getAttribute('data-item-id'));
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
      });
    });

    zones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', (e) => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        
        const itemId = e.dataTransfer.getData('text/plain');
        const draggedItem = container.querySelector(`[data-item-id="${itemId}"]`);
        
        if (draggedItem) {
          zone.appendChild(draggedItem);
          
          // Collect placements and save answer
          const placements = {};
          zones.forEach((z, zi) => {
            const itemInZone = z.querySelector('.draggable-item');
            if (itemInZone) {
              const itemIdx = itemInZone.getAttribute('data-item-id');
              placements[itemIdx] = zi;
            }
          });
          
          onAnswerChange(questionId, placements, index);
        }
      });
    });
  }

  /**
   * Render unsupported question type
   */
  renderUnsupported(type) {
    const div = document.createElement('div');
    div.className = 'alert alert-warning';
    div.textContent = `نوع السؤال "${type}" غير مدعوم حالياً`;
    return div;
  }
}

// Global instance
window.quizRenderer = new QuizRenderer();

// Global helper functions
window.toggleHint = function(index) {
  const hint = document.getElementById(`hint-${index}`);
  hint.classList.toggle('d-none');
};

window.selectOption = function(index, questionId, value, element = null) {
  window.__quizAnswers = window.__quizAnswers || {};
  window.__quizAnswers[questionId] = value;

  if (element && element.classList.contains('option-item')) {
    const parent = element.parentElement;
    parent.querySelectorAll('.option-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
  }

  // Update nav dot
  const dot = document.getElementById(`nav-dot-${index}`);
  if (dot) dot.classList.add('completed');
};

window.updateMatching = function(index, questionId, leftIndex, rightIndex) {
  window.__quizAnswers = window.__quizAnswers || {};
  if (!window.__quizAnswers[questionId]) {
    window.__quizAnswers[questionId] = {};
  }
  window.__quizAnswers[questionId][leftIndex] = parseInt(rightIndex);

  // Update nav dot
  const dot = document.getElementById(`nav-dot-${index}`);
  if (dot) dot.classList.add('completed');
};

window.updateFillBlank = function(index, questionId) {
  const inputs = document.querySelectorAll(`#q-card-${index} .blank-input`);
  const answers = Array.from(inputs).map(input => input.value.trim());
  
  window.__quizAnswers = window.__quizAnswers || {};
  window.__quizAnswers[questionId] = answers;

  // Update nav dot
  const dot = document.getElementById(`nav-dot-${index}`);
  if (dot) dot.classList.add('completed');
};

console.log('✅ Quiz renderer initialized');
