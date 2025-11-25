import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Calendar, GripVertical } from 'lucide-react';

interface Question {
  id: number;
  number: number;
  question: string;
  answer: string;
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
                {topic.questions.map((q, index) => {
                  const key = `${selectedDate}-${topic.id}-${q.id}`;
                  const isExpanded = expandedQuestions[key];
                  
                  return (
                    <div 
                      key={q.id} 
                      className="border border-gray-200 rounded-lg overflow-hidden"
                      draggable
                      onDragStart={(e) => handleDragStart(e, selectedDate, topic.id, q.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, selectedDate, topic.id, index)}
                    >
                      <div
                        onClick={() => toggleQuestion(selectedDate, topic.id, q.id)}
                        className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="text-gray-400 cursor-grab" size={16} />
                          <span className="bg-indigo-600 text-white px-2 py-1 rounded-full text-sm font-bold min-w-[24px] text-center">
                            {q.number}
                          </span>
                          <h3 className="font-semibold text-gray-800 flex-1">{q.question}</h3>
                        </div>
                        <div className="flex items-center gap-2">
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
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-gray-700">{q.answer}</p>
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
                      placeholder="Enter answer"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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