import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Calendar, GripVertical, Edit2, Link, Copy } from 'lucide-react';

interface Question {
  id: number;
  number: number;
  question: string;
  answer: string;
  duplicateOf?: number[];
  isDuplicate?: boolean;
}

interface Topic {
  id: number;
  name: string;
  questions: Question[];
}

interface DateGroup {
  id: string;
  date: string;
  topics: Topic[];
}

export default function Revision() {
  const loadInitialData = (): DateGroup[] => {
    const savedData = localStorage.getItem('revisionData');
    if (savedData) {
      return JSON.parse(savedData);
    }
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: today,
        date: today,
        topics: [
          {
            id: 1,
            name: 'Getting Started',
            questions: [
              { id: 1, number: 1, question: 'How do I create an account?', answer: 'Click on the Sign Up button and fill in your details.' },
              { id: 2, number: 2, question: 'Is there a mobile app?', answer: 'Yes, we have apps available for both iOS and Android.' }
            ]
          }
        ]
      }
    ];
  };

  const [dateGroups, setDateGroups] = useState<DateGroup[]>(loadInitialData);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newDateInput, setNewDateInput] = useState('');
  const [showDateForm, setShowDateForm] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<{ dateId: string; topicId: number; questionId: number } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{ dateId: string; topicId: number; questionId: number; field: 'question' | 'answer' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [duplicateInput, setDuplicateInput] = useState<Record<string, string>>({});
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  useEffect(() => {
    localStorage.setItem('revisionData', JSON.stringify(dateGroups));
  }, [dateGroups]);
  
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [newTopicName, setNewTopicName] = useState('');
  const [showTopicForm, setShowTopicForm] = useState<Record<string, boolean>>({});
  const [newQuestion, setNewQuestion] = useState<Record<string, { question: string; answer: string }>>({});
  const [showQuestionForm, setShowQuestionForm] = useState<Record<string, boolean>>({});

  const getCurrentDateGroup = () => {
    return dateGroups.find(dg => dg.id === selectedDate) || null;
  };

  const renumberQuestions = (questions: Question[]): Question[] => {
    return questions.map((q, index) => ({ ...q, number: index + 1 }));
  };

  const toggleQuestion = (dateId: string, topicId: number, questionId: number) => {
    const key = `${dateId}-${topicId}-${questionId}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const addDate = () => {
    if (newDateInput && !dateGroups.find(dg => dg.id === newDateInput)) {
      const newDateGroup: DateGroup = {
        id: newDateInput,
        date: newDateInput,
        topics: []
      };
      setDateGroups(prev => [...prev, newDateGroup].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setSelectedDate(newDateInput);
      setNewDateInput('');
      setShowDateForm(false);
    }
  };

  const addTopic = (dateId: string) => {
    if (newTopicName.trim()) {
      const newTopic: Topic = {
        id: Date.now(),
        name: newTopicName,
        questions: []
      };
      setDateGroups(prev => prev.map(dg => 
        dg.id === dateId 
          ? { ...dg, topics: [...dg.topics, newTopic] }
          : dg
      ));
      setNewTopicName('');
      setShowTopicForm(prev => ({ ...prev, [dateId]: false }));
    }
  };

  const addQuestion = (dateId: string, topicId: number) => {
    const key = `${dateId}-${topicId}`;
    const question = newQuestion[key]?.question;
    const answer = newQuestion[key]?.answer;
    
    if (question && answer) {
      setDateGroups(prev => prev.map(dg => 
        dg.id === dateId
          ? {
              ...dg,
              topics: dg.topics.map(topic => 
                topic.id === topicId
                  ? {
                      ...topic,
                      questions: renumberQuestions([
                        ...topic.questions,
                        { id: Date.now(), number: topic.questions.length + 1, question, answer }
                      ])
                    }
                  : topic
              )
            }
          : dg
      ));
      
      setNewQuestion(prev => ({
        ...prev,
        [key]: { question: '', answer: '' }
      }));
      setShowQuestionForm(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  const deleteDate = (dateId: string) => {
    setDateGroups(prev => prev.filter(dg => dg.id !== dateId));
    // If the deleted date was selected, select the first available date
    if (selectedDate === dateId) {
      const remaining = dateGroups.filter(dg => dg.id !== dateId);
      if (remaining.length > 0) {
        setSelectedDate(remaining[0].id);
      } else {
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }
    }
  };

  const deleteTopic = (dateId: string, topicId: number) => {
    setDateGroups(prev => prev.map(dg => 
      dg.id === dateId
        ? { ...dg, topics: dg.topics.filter(topic => topic.id !== topicId) }
        : dg
    ));
  };

  const deleteQuestion = (dateId: string, topicId: number, questionId: number) => {
    setDateGroups(prev => prev.map(dg => 
      dg.id === dateId
        ? {
            ...dg,
            topics: dg.topics.map(topic => 
              topic.id === topicId
                ? { ...topic, questions: renumberQuestions(topic.questions.filter(q => q.id !== questionId)) }
                : topic
            )
          }
        : dg
    ));
  };

  const handleDragStart = (e: React.DragEvent, dateId: string, topicId: number, questionId: number) => {
    setDraggedQuestion({ dateId, topicId, questionId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDateId: string, targetTopicId: number, dropIndex: number) => {
    e.preventDefault();
    if (!draggedQuestion) return;

    const { dateId: sourceDate, topicId: sourceTopicId, questionId: sourceQuestionId } = draggedQuestion;
    
    setDateGroups(prev => {
      const newDateGroups = [...prev];
      
      // Find source and target date groups
      const sourceDateGroup = newDateGroups.find(dg => dg.id === sourceDate);
      const targetDateGroup = newDateGroups.find(dg => dg.id === targetDateId);
      
      if (!sourceDateGroup || !targetDateGroup) return prev;
      
      // Find source and target topics
      const sourceTopic = sourceDateGroup.topics.find(t => t.id === sourceTopicId);
      const targetTopic = targetDateGroup.topics.find(t => t.id === targetTopicId);
      
      if (!sourceTopic || !targetTopic) return prev;
      
      // Find the question to move
      const questionToMove = sourceTopic.questions.find(q => q.id === sourceQuestionId);
      if (!questionToMove) return prev;
      
      // Remove from source
      sourceTopic.questions = sourceTopic.questions.filter(q => q.id !== sourceQuestionId);
      sourceTopic.questions = renumberQuestions(sourceTopic.questions);
      
      // Add to target
      targetTopic.questions.splice(dropIndex, 0, questionToMove);
      targetTopic.questions = renumberQuestions(targetTopic.questions);
      
      return newDateGroups;
    });
    
    setDraggedQuestion(null);
  };

  const getTotalQuestions = (topics: Topic[]): number => {
    return topics.reduce((sum, topic) => sum + topic.questions.length, 0);
  };

  const startEditing = (dateId: string, topicId: number, questionId: number, field: 'question' | 'answer') => {
    const question = dateGroups
      .find(dg => dg.id === dateId)?.topics
      .find(t => t.id === topicId)?.questions
      .find(q => q.id === questionId);
    
    if (question) {
      setEditingQuestion({ dateId, topicId, questionId, field });
      setEditValue(field === 'question' ? question.question : question.answer);
    }
  };

  const saveEdit = () => {
    if (!editingQuestion) return;

    const { dateId, topicId, questionId, field } = editingQuestion;
    
    setDateGroups(prev => prev.map(dg => 
      dg.id === dateId
        ? {
            ...dg,
            topics: dg.topics.map(topic => 
              topic.id === topicId
                ? {
                    ...topic,
                    questions: topic.questions.map(q => 
                      q.id === questionId
                        ? { ...q, [field]: editValue }
                        : q
                    )
                  }
                : topic
            )
          }
        : dg
    ));
    
    setEditingQuestion(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditValue('');
  };

  const detectDuplicates = (questions: Question[]): Question[] => {
    const duplicateMap = new Map<number, number[]>();
    
    // First, preserve any manually added duplicates
    questions.forEach(q => {
      if (q.duplicateOf && q.duplicateOf.length > 0) {
        duplicateMap.set(q.number, [...q.duplicateOf]);
      }
    });
    
    // Then detect automatic duplicates
    for (let i = 0; i < questions.length; i++) {
      const current = questions[i];
      const currentWords = current.question.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !/^\d+$/.test(word)); // Exclude pure numbers
      
      for (let j = i + 1; j < questions.length; j++) {
        const compare = questions[j];
        const compareWords = compare.question.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2)
          .filter(word => !/^\d+$/.test(word)); // Exclude pure numbers
        
        const commonWords = currentWords.filter(word => compareWords.includes(word));
        
        if (commonWords.length >= 5) {
          // Add to current question's duplicates
          const currentDuplicates = duplicateMap.get(current.number) || [];
          if (!currentDuplicates.includes(compare.number)) {
            duplicateMap.set(current.number, [...currentDuplicates, compare.number]);
          }
          
          // Add to compare question's duplicates
          const compareDuplicates = duplicateMap.get(compare.number) || [];
          if (!compareDuplicates.includes(current.number)) {
            duplicateMap.set(compare.number, [...compareDuplicates, current.number]);
          }
        }
      }
    }
    
    return questions.map(q => ({
      ...q,
      duplicateOf: duplicateMap.get(q.number) || [],
      isDuplicate: duplicateMap.has(q.number) && duplicateMap.get(q.number)!.length > 0
    }));
  };

  const addManualDuplicate = (dateId: string, topicId: number, questionNumber: number) => {
    const key = `${dateId}-${topicId}-${questionNumber}`;
    const duplicateNumbers = duplicateInput[key]?.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) || [];
    
    if (duplicateNumbers.length === 0) return;
    
    setDateGroups(prev => prev.map(dg => 
      dg.id === dateId
        ? {
            ...dg,
            topics: dg.topics.map(topic => 
              topic.id === topicId
                ? {
                    ...topic,
                    questions: topic.questions.map(q => {
                      if (q.number === questionNumber) {
                        const existingDuplicates = q.duplicateOf || [];
                        const newDuplicates = [...new Set([...existingDuplicates, ...duplicateNumbers])];
                        return { ...q, duplicateOf: newDuplicates, isDuplicate: newDuplicates.length > 0 };
                      }
                      if (duplicateNumbers.includes(q.number)) {
                        const existingDuplicates = q.duplicateOf || [];
                        const newDuplicates = [...new Set([...existingDuplicates, questionNumber])];
                        return { ...q, duplicateOf: newDuplicates, isDuplicate: newDuplicates.length > 0 };
                      }
                      return q;
                    })
                  }
                : topic
            )
          }
        : dg
    ));
    
    setDuplicateInput(prev => ({ ...prev, [key]: '' }));
  };

  const scrollToQuestion = (questionNumber: number) => {
    // First, find the question across all date groups and topics
    let targetQuestion = null;
    let targetDateId = null;
    let targetTopicId = null;
    
    for (const dateGroup of dateGroups) {
      for (const topic of dateGroup.topics) {
        const foundQuestion = topic.questions.find(q => q.number === questionNumber);
        if (foundQuestion) {
          targetQuestion = foundQuestion;
          targetDateId = dateGroup.id;
          targetTopicId = topic.id;
          break;
        }
      }
      if (targetQuestion) break;
    }
    
    if (!targetQuestion || !targetDateId || !targetTopicId) {
      alert(`Question ${questionNumber} not found!`);
      return;
    }
    
    // Switch to the correct date if needed
    if (targetDateId !== selectedDate) {
      setSelectedDate(targetDateId);
      // Wait for the date switch to complete
      setTimeout(() => {
        scrollToQuestionElement(targetDateId, targetTopicId, targetQuestion.id);
      }, 100);
    } else {
      scrollToQuestionElement(targetDateId, targetTopicId, targetQuestion.id);
    }
  };
  
  const scrollToQuestionElement = (dateId: string, topicId: number, questionId: number) => {
    const questionKey = `${dateId}-${topicId}-${questionId}`;
    
    // Expand the question first
    setExpandedQuestions(prev => ({
      ...prev,
      [questionKey]: true
    }));
    
    // Wait a bit for expansion, then scroll
    setTimeout(() => {
      const element = questionRefs.current[questionKey];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight the question briefly
        element.style.backgroundColor = '#fef3c7';
        element.style.transform = 'scale(1.02)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
          element.style.backgroundColor = '';
          element.style.transform = '';
        }, 2000);
      }
    }, 200);
  };


  const copyToClipboard = async (text: string, type: 'question' | 'answer') => {
    try {
      await navigator.clipboard.writeText(text);
      // Show temporary feedback
      const event = new CustomEvent('showToast', { 
        detail: { message: `${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`, type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      const event = new CustomEvent('showToast', { 
        detail: { message: `${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`, type: 'success' }
      });
      window.dispatchEvent(event);
    }
  };

  const currentDateGroup = getCurrentDateGroup();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Revision Manager</h1>
          <p className="text-gray-600">Organize your questions and answers by date and topics</p>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
              <Calendar size={24} />
              Select Date ({dateGroups.reduce((sum, dg) => sum + getTotalQuestions(dg.topics), 0)} total questions)
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {dateGroups.map(dateGroup => (
              <div
                key={dateGroup.id}
                className={`relative group rounded-lg transition flex items-center gap-2 ${
                  selectedDate === dateGroup.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <button
                  onClick={() => setSelectedDate(dateGroup.id)}
                  className="px-4 py-2 flex items-center gap-2 flex-1"
                >
                  {new Date(dateGroup.date).toLocaleDateString()}
                  <span className="bg-white text-black bg-opacity-20 px-2 py-1 rounded text-sm">
                    {getTotalQuestions(dateGroup.topics)}
                  </span>
                </button>
                {dateGroups.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDate(dateGroup.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-2"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {!showDateForm ? (
            <button
              onClick={() => setShowDateForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Plus size={20} />
              Add New Date
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="date"
                value={newDateInput}
                onChange={(e) => setNewDateInput(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addDate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowDateForm(false);
                  setNewDateInput('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Add Topic Button */}
        {currentDateGroup && (
          <div className="mb-6">
            {!showTopicForm[selectedDate] ? (
              <button
                onClick={() => setShowTopicForm(prev => ({ ...prev, [selectedDate]: true }))}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Plus size={20} />
                Add New Topic
              </button>
            ) : (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Enter topic name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => addTopic(selectedDate)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Add Topic
                  </button>
                  <button
                    onClick={() => {
                      setShowTopicForm(prev => ({ ...prev, [selectedDate]: false }));
                      setNewTopicName('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Topics and Questions */}
        <div className="space-y-6">
          {currentDateGroup?.topics.map(topic => (
            <div key={topic.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
                  {topic.name}
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-normal">
                    {topic.questions.length} questions
                  </span>
                </h2>
                <button
                  onClick={() => deleteTopic(selectedDate, topic.id)}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Questions */}
              <div className="space-y-3 mb-4">
                {detectDuplicates(topic.questions).map((q, index) => {
                  const key = `${selectedDate}-${topic.id}-${q.id}`;
                  const isExpanded = expandedQuestions[key];
                  const isEditing = editingQuestion?.dateId === selectedDate && editingQuestion?.topicId === topic.id && editingQuestion?.questionId === q.id;
                  const duplicateKey = `${selectedDate}-${topic.id}-${q.number}`;
                  
                  return (
                    <div 
                      key={q.id} 
                      //@ts-ignore
                      ref={(el) => questionRefs.current[key] = el}
                      className={`border rounded-lg overflow-hidden ${
                        q.isDuplicate ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                      }`}
                      draggable={!isEditing}
                      onDragStart={(e) => !isEditing && handleDragStart(e, selectedDate, topic.id, q.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, selectedDate, topic.id, index)}
                    >
                      <div
                        onClick={() => !isEditing && toggleQuestion(selectedDate, topic.id, q.id)}
                        className={`flex justify-between items-center p-4 hover:bg-gray-100 cursor-pointer transition ${
                          q.isDuplicate ? 'bg-yellow-100' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="text-gray-400 cursor-grab" size={16} />
                          <span className={`px-2 py-1 rounded-full text-sm font-bold min-w-[24px] text-center ${
                            q.isDuplicate ? 'bg-yellow-600 text-white' : 'bg-indigo-600 text-white'
                          }`}>
                            {q.number}
                          </span>
                          {isEditing && editingQuestion?.field === 'question' ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveEdit();
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEdit();
                                }}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800 flex-1">
                                {q.question}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(q.question, 'question');
                                }}
                                className="text-green-500 hover:text-green-700 transition p-1"
                                title="Copy question"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(selectedDate, topic.id, q.id, 'question');
                                }}
                                className="text-blue-500 hover:text-blue-700 transition p-1"
                                title="Edit question"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {q.isDuplicate && (
                            <div className="flex items-center gap-1">
                              <Link size={14} className="text-yellow-600" />
                              <div className="flex gap-1">
                                {q.duplicateOf?.map(dupNum => (
                                  <button
                                    key={dupNum}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      scrollToQuestion(dupNum);
                                    }}
                                    className="bg-yellow-600 text-white px-1 py-0.5 rounded text-xs hover:bg-yellow-700"
                                  >
                                    {dupNum}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuestion(selectedDate, topic.id, q.id);
                            }}
                            className="text-red-500 hover:text-red-700 transition p-1"
                          >
                            <X size={16} />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="text-indigo-600" size={20} />
                          ) : (
                            <ChevronDown className="text-indigo-600" size={20} />
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                          {isEditing && editingQuestion?.field === 'answer' ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows={4}
                                style={{ whiteSpace: 'pre-wrap' }}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={saveEdit}
                                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <p className="text-gray-700 flex-1" style={{ whiteSpace: 'pre-wrap' }}>
                                {q.answer}
                              </p>
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(q.answer, 'answer');
                                  }}
                                  className="text-green-500 hover:text-green-700 transition p-1"
                                  title="Copy answer"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={() => startEditing(selectedDate, topic.id, q.id, 'answer')}
                                  className="text-blue-500 hover:text-blue-700 transition p-1"
                                  title="Edit answer"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Manual Duplicate Input */}
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <label className="text-sm font-medium text-gray-600">Mark as duplicate of questions:</label>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={duplicateInput[duplicateKey] || ''}
                                onChange={(e) => setDuplicateInput(prev => ({ ...prev, [duplicateKey]: e.target.value }))}
                                placeholder="Enter question numbers (e.g., 1,3,5)"
                                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => addManualDuplicate(selectedDate, topic.id, q.number)}
                                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                              >
                                Link
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Question Form */}
              {(() => {
                const formKey = `${selectedDate}-${topic.id}`;
                return !showQuestionForm[formKey] ? (
                  <button
                    onClick={() => setShowQuestionForm(prev => ({ ...prev, [formKey]: true }))}
                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Question
                  </button>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      value={newQuestion[formKey]?.question || ''}
                      onChange={(e) => setNewQuestion(prev => ({
                        ...prev,
                        [formKey]: { ...prev[formKey], question: e.target.value }
                      }))}
                      placeholder="Enter question"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                      value={newQuestion[formKey]?.answer || ''}
                      onChange={(e) => setNewQuestion(prev => ({
                        ...prev,
                        [formKey]: { ...prev[formKey], answer: e.target.value }
                      }))}
                      placeholder="Enter answer (formatting preserved when pasting)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => addQuestion(selectedDate, topic.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        Add Question
                      </button>
                      <button
                        onClick={() => {
                          setShowQuestionForm(prev => ({ ...prev, [formKey]: false }));
                          setNewQuestion(prev => ({
                            ...prev,
                            [formKey]: { question: '', answer: '' }
                          }));
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>

        {!currentDateGroup && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Select or create a date to get started!</p>
          </div>
        )}
        
        {currentDateGroup && currentDateGroup.topics.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No topics for this date yet. Add your first topic to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}