import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Calendar, GripVertical, Edit2, Link, Copy, Check, Search, Download, Upload, Merge } from 'lucide-react';

interface Question {
  id: number;
  number: number;
  question: string;
  answer: string;
  duplicateOf?: number[];
  isDuplicate?: boolean;
  isToggled?: boolean;
  revisionCount?: number;
  lastRevisionDate?: string;
  originalQuestionId?: number;
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

interface Reminder {
  id: number;
  title: string;
  description: string;
  scheduledDate: string;
  questionIds: number[];
  isCompleted: boolean;
  createdAt: string;
}

interface RevisionDateGroup {
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
  const [showDuplicateSelector, setShowDuplicateSelector] = useState<Record<string, boolean>>({});
  const [selectedDuplicates, setSelectedDuplicates] = useState<Record<string, number[]>>({});
  const [filteredQuestionNumber, setFilteredQuestionNumber] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ dateId: string; topicId: number } | null>(null);
  const [editTopicValue, setEditTopicValue] = useState('');
  const [topicPages, setTopicPages] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [popupQuestion, setPopupQuestion] = useState('');
  const [popupAnswer, setPopupAnswer] = useState('');
  const [popupTopicId, setPopupTopicId] = useState<number | null>(null);
  const [draggedTopic, setDraggedTopic] = useState<{ dateId: string; topicId: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'revision' | 'reminders'>('revision');
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const savedReminders = localStorage.getItem('revisionReminders');
    return savedReminders ? JSON.parse(savedReminders) : [];
  });
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    selectedQuestions: [] as number[]
  });
  const [revisionDateGroups, setRevisionDateGroups] = useState<RevisionDateGroup[]>(() => {
    const savedRevisionData = localStorage.getItem('revisionDateGroups');
    return savedRevisionData ? JSON.parse(savedRevisionData) : [];
  });
  const [showDatePicker, setShowDatePicker] = useState<Record<string, boolean>>({});
  const [selectedRevisionDate, setSelectedRevisionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [revisionViewMode, setRevisionViewMode] = useState<'list' | 'calendar'>('list');
  const [revisionCalendarDate, setRevisionCalendarDate] = useState(new Date());
  const [revisionTopicPages, setRevisionTopicPages] = useState<Record<string, number>>({});
  const [revisionSearchQuery, setRevisionSearchQuery] = useState('');
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  useEffect(() => {
    localStorage.setItem('revisionData', JSON.stringify(dateGroups));
  }, [dateGroups]);

  useEffect(() => {
    localStorage.setItem('revisionReminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('revisionDateGroups', JSON.stringify(revisionDateGroups));
  }, [revisionDateGroups]);
  
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

  const toggleQuestionExpansion = (dateId: string, topicId: number, questionId: number) => {
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

  const addQuestion = (dateId: string, topicId: number, questionText?: string, answerText?: string) => {
    const key = `${dateId}-${topicId}`;
    const question = questionText || newQuestion[key]?.question;
    const answer = answerText || newQuestion[key]?.answer;
    
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
      
      if (!questionText && !answerText) {
        // Only clear form data if not using popup
        setNewQuestion(prev => ({
          ...prev,
          [key]: { question: '', answer: '' }
        }));
        setShowQuestionForm(prev => ({
          ...prev,
          [key]: false
        }));
      }
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

  const getQuestionsWithDuplicates = (questions: Question[]): Question[] => {
    // Only preserve manually added duplicates, no automatic detection
    return questions.map(q => ({
      ...q,
      isDuplicate: q.duplicateOf && q.duplicateOf.length > 0
    }));
  };

  const getAllQuestions = () => {
    const allQuestions: Array<{
      dateId: string;
      date: string;
      topicId: number;
      topicName: string;
      question: Question;
    }> = [];

    dateGroups.forEach(dateGroup => {
      dateGroup.topics.forEach(topic => {
        topic.questions.forEach(question => {
          allQuestions.push({
            dateId: dateGroup.id,
            date: dateGroup.date,
            topicId: topic.id,
            topicName: topic.name,
            question
          });
        });
      });
    });

    return allQuestions.sort((a, b) => a.question.number - b.question.number);
  };

  const getPaginatedQuestions = (questions: Question[], topicKey: string) => {
    const questionsPerPage = 8;
    const currentPage = topicPages[topicKey] || 1;
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    
    return {
      questions: questions.slice(startIndex, endIndex),
      totalPages: Math.ceil(questions.length / questionsPerPage),
      currentPage,
      totalQuestions: questions.length
    };
  };

  const setTopicPage = (topicKey: string, page: number) => {
    setTopicPages(prev => ({ ...prev, [topicKey]: page }));
  };

  const toggleDuplicateSelection = (selectorKey: string, questionNumber: number) => {
    setSelectedDuplicates(prev => {
      const current = prev[selectorKey] || [];
      const isSelected = current.includes(questionNumber);
      
      if (isSelected) {
        return { ...prev, [selectorKey]: current.filter(n => n !== questionNumber) };
      } else {
        return { ...prev, [selectorKey]: [...current, questionNumber] };
      }
    });
  };

  const addManualDuplicate = (dateId: string, topicId: number, questionNumber: number) => {
    const key = `${dateId}-${topicId}-${questionNumber}`;
    const duplicateNumbers = selectedDuplicates[key] || [];
    
    if (duplicateNumbers.length === 0) return;
    
    // Update all date groups to link the duplicates bidirectionally
    setDateGroups(prev => prev.map(dg => ({
      ...dg,
      topics: dg.topics.map(topic => ({
        ...topic,
        questions: topic.questions.map(q => {
          if (q.number === questionNumber) {
            // Add duplicates to the main question
            const existingDuplicates = q.duplicateOf || [];
            const newDuplicates = [...new Set([...existingDuplicates, ...duplicateNumbers])];
            return { ...q, duplicateOf: newDuplicates, isDuplicate: newDuplicates.length > 0 };
          }
          if (duplicateNumbers.includes(q.number)) {
            // Add bidirectional link to the duplicate questions
            const existingDuplicates = q.duplicateOf || [];
            const newDuplicates = [...new Set([...existingDuplicates, questionNumber])];
            return { ...q, duplicateOf: newDuplicates, isDuplicate: newDuplicates.length > 0 };
          }
          return q;
        })
      }))
    })));
    
    setSelectedDuplicates(prev => ({ ...prev, [key]: [] }));
    setShowDuplicateSelector(prev => ({ ...prev, [key]: false }));
  };

  const filterByQuestionNumber = (questionNumber: number) => {
    setFilteredQuestionNumber(questionNumber);
    // Find and switch to the correct date for this question
    for (const dateGroup of dateGroups) {
      for (const topic of dateGroup.topics) {
        const foundQuestion = topic.questions.find(q => q.number === questionNumber);
        if (foundQuestion) {
          setSelectedDate(dateGroup.id);
          return;
        }
      }
    }
  };

  const clearFilter = () => {
    setFilteredQuestionNumber(null);
  };

  const removeDuplicateLink = (currentQuestionNumber: number, duplicateQuestionNumber: number) => {
    setDateGroups(prev => prev.map(dg => ({
      ...dg,
      topics: dg.topics.map(topic => ({
        ...topic,
        questions: topic.questions.map(q => {
          if (q.number === currentQuestionNumber) {
            // Remove the duplicate from current question
            const newDuplicates = (q.duplicateOf || []).filter(dupNum => dupNum !== duplicateQuestionNumber);
            return { ...q, duplicateOf: newDuplicates, isDuplicate: newDuplicates.length > 0 };
          }
          if (q.number === duplicateQuestionNumber) {
            // Remove the bidirectional link
            const newDuplicates = (q.duplicateOf || []).filter(dupNum => dupNum !== currentQuestionNumber);
            return { ...q, duplicateOf: newDuplicates, isDuplicate: newDuplicates.length > 0 };
          }
          return q;
        })
      }))
    })));
  };

  const startEditingTopic = (dateId: string, topicId: number) => {
    const topic = dateGroups
      .find(dg => dg.id === dateId)?.topics
      .find(t => t.id === topicId);
    
    if (topic) {
      setEditingTopic({ dateId, topicId });
      setEditTopicValue(topic.name);
    }
  };

  const saveTopicEdit = () => {
    if (!editingTopic) return;

    const { dateId, topicId } = editingTopic;
    
    setDateGroups(prev => prev.map(dg => 
      dg.id === dateId
        ? {
            ...dg,
            topics: dg.topics.map(topic => 
              topic.id === topicId
                ? { ...topic, name: editTopicValue }
                : topic
            )
          }
        : dg
    ));
    
    setEditingTopic(null);
    setEditTopicValue('');
  };

  const cancelTopicEdit = () => {
    setEditingTopic(null);
    setEditTopicValue('');
  };

  const deleteAllQuestions = (dateId: string, topicId?: number) => {
    if (topicId) {
      // Delete all questions in a specific topic
      if (confirm('Delete all questions in this topic?')) {
        setDateGroups(prev => prev.map(dg => 
          dg.id === dateId
            ? {
                ...dg,
                topics: dg.topics.map(topic => 
                  topic.id === topicId
                    ? { ...topic, questions: [] }
                    : topic
                )
              }
            : dg
        ));
      }
    } else {
      // Delete all questions for a date
      if (confirm('Delete all questions for this date?')) {
        setDateGroups(prev => prev.map(dg => 
          dg.id === dateId
            ? {
                ...dg,
                topics: dg.topics.map(topic => ({ ...topic, questions: [] }))
              }
            : dg
        ));
      }
    }
  };

  const mergeTopicsByName = (dateId: string) => {
    if (confirm('Merge topics with identical names?')) {
      setDateGroups(prev => prev.map(dg => {
        if (dg.id !== dateId) return dg;
        
        const topicGroups = new Map<string, Topic[]>();
        
        // Group topics by name
        dg.topics.forEach(topic => {
          const key = topic.name.toLowerCase().trim();
          if (!topicGroups.has(key)) {
            topicGroups.set(key, []);
          }
          topicGroups.get(key)!.push(topic);
        });
        
        // Merge topics with same names
        const mergedTopics: Topic[] = [];
        topicGroups.forEach((topics) => {
          if (topics.length === 1) {
            mergedTopics.push(topics[0]);
          } else {
            // Merge multiple topics
            const mergedQuestions: Question[] = [];
            topics.forEach(topic => {
              mergedQuestions.push(...topic.questions);
            });
            
            mergedTopics.push({
              id: topics[0].id,
              name: topics[0].name,
              questions: renumberQuestions(mergedQuestions)
            });
          }
        });
        
        return { ...dg, topics: mergedTopics };
      }));
    }
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

  const toggleQuestion = (dateId: string, topicId: number, questionId: number) => {
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
                        ? { ...q, isToggled: !q.isToggled }
                        : q
                    )
                  }
                : topic
            )
          }
        : dg
    ));
  };

  const exportData = (format: 'json' | 'pdf') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(dateGroups, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `revision-data-${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // PDF export - create a formatted text version
      let pdfContent = 'REVISION DATA EXPORT\\n\\n';
      dateGroups.forEach(dateGroup => {
        pdfContent += `DATE: ${new Date(dateGroup.date).toLocaleDateString()}\\n`;
        pdfContent += `Total Questions: ${getTotalQuestions(dateGroup.topics)}\\n\\n`;
        
        dateGroup.topics.forEach(topic => {
          pdfContent += `TOPIC: ${topic.name} (${topic.questions.length} questions)\\n`;
          pdfContent += '-'.repeat(50) + '\\n';
          
          topic.questions.forEach(q => {
            pdfContent += `Q${q.number}: ${q.question}\\n`;
            pdfContent += `A: ${q.answer}\\n`;
            if (q.isDuplicate && q.duplicateOf) {
              pdfContent += `Duplicates: ${q.duplicateOf.join(', ')}\\n`;
            }
            pdfContent += '\\n';
          });
          pdfContent += '\\n';
        });
        pdfContent += '\\n';
      });
      
      const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(pdfContent);
      const exportFileDefaultName = `revision-data-${new Date().toISOString().split('T')[0]}.txt`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          setDateGroups(importedData);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    // Generate 6 weeks of dates
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return {
      days,
      monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  };

  const getDateQuestionCount = (date: Date): number => {
    const dateStr = date.toISOString().split('T')[0];
    const dateGroup = dateGroups.find(dg => dg.id === dateStr);
    return dateGroup ? getTotalQuestions(dateGroup.topics) : 0;
  };

  const openQuestionPopup = (topicId: number) => {
    setPopupTopicId(topicId);
    setShowQuestionPopup(true);
    setPopupQuestion('');
    setPopupAnswer('');
  };

  const closeQuestionPopup = () => {
    setShowQuestionPopup(false);
    setPopupQuestion('');
    setPopupAnswer('');
    setPopupTopicId(null);
  };

  const addQuestionFromPopup = () => {
    if (popupQuestion.trim() && popupAnswer.trim() && popupTopicId) {
      addQuestion(selectedDate, popupTopicId, popupQuestion, popupAnswer);
      closeQuestionPopup();
    }
  };

  const handleTopicDragStart = (e: React.DragEvent, dateId: string, topicId: number) => {
    setDraggedTopic({ dateId, topicId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTopicDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTopicDrop = (e: React.DragEvent, targetDateId: string, dropIndex: number) => {
    e.preventDefault();
    if (!draggedTopic) return;

    const { dateId: sourceDate, topicId: sourceTopicId } = draggedTopic;
    
    setDateGroups(prev => {
      const newDateGroups = [...prev];
      
      // Find source and target date groups
      const sourceDateGroup = newDateGroups.find(dg => dg.id === sourceDate);
      const targetDateGroup = newDateGroups.find(dg => dg.id === targetDateId);
      
      if (!sourceDateGroup || !targetDateGroup) return prev;
      
      // Find the topic to move
      const topicIndex = sourceDateGroup.topics.findIndex(t => t.id === sourceTopicId);
      if (topicIndex === -1) return prev;
      
      const topicToMove = sourceDateGroup.topics[topicIndex];
      
      // If moving within the same date group
      if (sourceDate === targetDateId) {
        // Reorder within the same date
        const newTopics = [...sourceDateGroup.topics];
        newTopics.splice(topicIndex, 1);
        newTopics.splice(dropIndex, 0, topicToMove);
        sourceDateGroup.topics = newTopics;
      } else {
        // Move to different date group
        sourceDateGroup.topics = sourceDateGroup.topics.filter(t => t.id !== sourceTopicId);
        targetDateGroup.topics.splice(dropIndex, 0, topicToMove);
      }
      
      return newDateGroups;
    });
    
    setDraggedTopic(null);
  };

  const truncateTopicName = (name: string, maxLength: number = 20): string => {
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
  };

  const addReminder = () => {
    if (newReminder.title.trim() && newReminder.scheduledDate) {
      const reminder: Reminder = {
        id: Date.now(),
        title: newReminder.title,
        description: newReminder.description,
        scheduledDate: newReminder.scheduledDate,
        questionIds: newReminder.selectedQuestions,
        isCompleted: false,
        createdAt: new Date().toISOString()
      };
      
      setReminders(prev => [...prev, reminder]);
      setNewReminder({
        title: '',
        description: '',
        scheduledDate: '',
        selectedQuestions: []
      });
      setShowReminderForm(false);
    }
  };
  const getUpcomingReminders = () => {
    const today = new Date().toISOString().split('T')[0];
    return reminders
      .filter(reminder => !reminder.isCompleted && reminder.scheduledDate >= today)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  };

  const getOverdueReminders = () => {
    const today = new Date().toISOString().split('T')[0];
    return reminders
      .filter(reminder => !reminder.isCompleted && reminder.scheduledDate < today)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  };

  const scheduleQuestionForRevision = (dateId: string, topicId: number, questionId: number, revisionDate: string) => {
    const question = dateGroups
      .find(dg => dg.id === dateId)?.topics
      .find(t => t.id === topicId)?.questions
      .find(q => q.id === questionId);
    
    if (!question) return;

    // Create a copy of the question with revision tracking
    const revisionQuestion: Question = {
      ...question,
      id: Date.now(),
      revisionCount: (question.revisionCount || 0) + 1,
      lastRevisionDate: revisionDate,
      originalQuestionId: question.originalQuestionId || question.id
    };

    // Add to revision date groups
    setRevisionDateGroups(prev => {
      const newGroups = [...prev];
      let targetGroup = newGroups.find(dg => dg.id === revisionDate);
      
      if (!targetGroup) {
        // Create new date group
        targetGroup = {
          id: revisionDate,
          date: revisionDate,
          topics: []
        };
        newGroups.push(targetGroup);
        newGroups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      // Find or create topic
      const topicName = dateGroups.find(dg => dg.id === dateId)?.topics.find(t => t.id === topicId)?.name || 'Untitled Topic';
      let targetTopic = targetGroup.topics.find(t => t.name === topicName);
      
      if (!targetTopic) {
        targetTopic = {
          id: Date.now(),
          name: topicName,
          questions: []
        };
        targetGroup.topics.push(targetTopic);
      }

      // Add question and renumber
      targetTopic.questions.push(revisionQuestion);
      targetTopic.questions = renumberQuestions(targetTopic.questions);

      return newGroups;
    });

    // Hide date picker
    const key = `${dateId}-${topicId}-${questionId}`;
    setShowDatePicker(prev => ({ ...prev, [key]: false }));
  };

  const rescheduleRevisionQuestion = (currentDate: string, topicId: number, questionId: number, newDate: string) => {
    setRevisionDateGroups(prev => {
      const newGroups = [...prev];
      
      // Find and remove question from current date
      const currentGroup = newGroups.find(dg => dg.id === currentDate);
      if (!currentGroup) return prev;
      
      const currentTopic = currentGroup.topics.find(t => t.id === topicId);
      if (!currentTopic) return prev;
      
      const questionIndex = currentTopic.questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) return prev;
      
      const question = currentTopic.questions[questionIndex];
      
      // Update revision count and date
      const updatedQuestion = {
        ...question,
        revisionCount: (question.revisionCount || 0) + 1,
        lastRevisionDate: newDate
      };
      
      // Remove from current location
      currentTopic.questions.splice(questionIndex, 1);
      currentTopic.questions = renumberQuestions(currentTopic.questions);
      
      // Remove empty topics/dates
      if (currentTopic.questions.length === 0) {
        currentGroup.topics = currentGroup.topics.filter(t => t.id !== topicId);
      }
      if (currentGroup.topics.length === 0) {
        return newGroups.filter(dg => dg.id !== currentDate);
      }
      
      // Add to new date
      let targetGroup = newGroups.find(dg => dg.id === newDate);
      if (!targetGroup) {
        targetGroup = {
          id: newDate,
          date: newDate,
          topics: []
        };
        newGroups.push(targetGroup);
        newGroups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      let targetTopic = targetGroup.topics.find(t => t.name === currentTopic.name);
      if (!targetTopic) {
        targetTopic = {
          id: Date.now(),
          name: currentTopic.name,
          questions: []
        };
        targetGroup.topics.push(targetTopic);
      }
      
      targetTopic.questions.push(updatedQuestion);
      targetTopic.questions = renumberQuestions(targetTopic.questions);
      
      return newGroups;
    });
  };

  const getRevisionDateGroup = (dateId: string) => {
    return revisionDateGroups.find(dg => dg.id === dateId) || null;
  };

  const getRevisionPaginatedQuestions = (questions: Question[], topicKey: string) => {
    const questionsPerPage = 8;
    const currentPage = revisionTopicPages[topicKey] || 1;
    const startIndex = (currentPage - 1) * questionsPerPage;
    const endIndex = startIndex + questionsPerPage;
    
    return {
      questions: questions.slice(startIndex, endIndex),
      totalPages: Math.ceil(questions.length / questionsPerPage),
      currentPage,
      totalQuestions: questions.length
    };
  };

  const setRevisionTopicPage = (topicKey: string, page: number) => {
    setRevisionTopicPages(prev => ({ ...prev, [topicKey]: page }));
  };

  const currentDateGroup = getCurrentDateGroup();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div></div>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-indigo-900 mb-2">Revision Manager</h1>
              <p className="text-gray-600">Organize your questions and answers by date and topics</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportData('json')}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                title="Export data as JSON"
              >
                <Download size={16} />
                JSON
              </button>
              <button
                onClick={() => exportData('pdf')}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
                title="Export data as text file"
              >
                <Download size={16} />
                TXT
              </button>
              <label className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm cursor-pointer">
                <Upload size={16} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex-1 py-4 px-6 text-center font-medium transition rounded-l-lg ${
                activeTab === 'revision'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Revision Manager
              {dateGroups.length > 0 && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                  {dateGroups.reduce((sum, dg) => sum + getTotalQuestions(dg.topics), 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex-1 py-4 px-6 text-center font-medium transition rounded-r-lg ${
                activeTab === 'reminders'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Revision Reminders
              {reminders.length > 0 && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded text-sm">
                  {getUpcomingReminders().length + getOverdueReminders().length}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === 'revision' ? (
          <>
            {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
              <Calendar size={24} />
              Select Date ({dateGroups.reduce((sum, dg) => sum + getTotalQuestions(dg.topics), 0)} total)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm transition ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded text-sm transition ${
                  viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Calendar View
              </button>
            </div>
            {currentDateGroup && getTotalQuestions(currentDateGroup.topics) > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => mergeTopicsByName(selectedDate)}
                  className="text-blue-600 hover:text-blue-800 transition text-sm px-3 py-1 border border-blue-300 rounded flex items-center gap-1"
                  title="Merge topics with identical names"
                >
                  <Merge size={14} />
                  Merge Topics
                </button>
                <button
                  onClick={() => deleteAllQuestions(selectedDate)}
                  className="text-orange-600 hover:text-orange-800 transition text-sm px-3 py-1 border border-orange-300 rounded"
                  title="Delete all questions for this date"
                >
                  Clear All Questions
                </button>
              </div>
            )}
          </div>
          
          {viewMode === 'list' ? (
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
          ) : (
            <div className="mb-4">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  ←
                </button>
                <h3 className="text-lg font-semibold">
                  {generateCalendar(calendarDate).monthName}
                </h3>
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  →
                </button>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
                {generateCalendar(calendarDate).days.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                  const questionCount = getDateQuestionCount(day);
                  const dateStr = day.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  const isToday = new Date().toDateString() === day.toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[50px] p-1 border rounded cursor-pointer transition
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                        ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}
                        ${isToday ? 'ring-2 ring-blue-400' : ''}
                      `}
                      onClick={() => {
                        const dateStr = day.toISOString().split('T')[0];
                        setSelectedDate(dateStr);
                        if (!dateGroups.find(dg => dg.id === dateStr)) {
                          const newDateGroup: DateGroup = {
                            id: dateStr,
                            date: dateStr,
                            topics: []
                          };
                          setDateGroups(prev => [...prev, newDateGroup]);
                        }
                      }}
                    >
                      <div className="text-center text-sm font-medium">
                        {day.getDate()}
                      </div>
                      {questionCount > 0 && (
                        <div className={`text-xs text-center mt-1 px-1 py-0.5 rounded ${
                          isSelected ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          ({questionCount})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
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

        {/* Filter Banner */}
        {filteredQuestionNumber && (
          <div className="mb-6 bg-yellow-100 border border-yellow-400 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-yellow-800 font-medium">
                  Filtering by Question #{filteredQuestionNumber}
                </span>
              </div>
              <button
                onClick={clearFilter}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition flex items-center gap-2"
              >
                <X size={16} />
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {/* Add Topic Button */}
        {currentDateGroup && !filteredQuestionNumber && (
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

        {/* Topic Tabs */}
        {currentDateGroup && currentDateGroup.topics.length > 0 && !filteredQuestionNumber && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Topic Tabs</h3>
              <span className="text-sm text-gray-500">(Drag to reorder)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentDateGroup.topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="group relative bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-lg transition cursor-move"
                  draggable={!editingTopic || (editingTopic.dateId !== selectedDate || editingTopic.topicId !== topic.id)}
                  onDragStart={(e) => handleTopicDragStart(e, selectedDate, topic.id)}
                  onDragOver={handleTopicDragOver}
                  onDrop={(e) => handleTopicDrop(e, selectedDate, index)}
                  title={topic.name.length > 20 ? topic.name : undefined}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <GripVertical className="text-gray-400 group-hover:text-gray-600" size={14} />
                    <span className="text-sm font-medium text-indigo-800">
                      {truncateTopicName(topic.name)}
                    </span>
                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {topic.questions.length}
                    </span>
                  </div>
                  {/* Drop zones for reordering */}
                  <div
                    className="absolute left-0 top-0 w-2 h-full opacity-0 hover:opacity-100 bg-blue-400 rounded-l-lg transition-opacity"
                    onDragOver={handleTopicDragOver}
                    onDrop={(e) => handleTopicDrop(e, selectedDate, index)}
                  />
                  <div
                    className="absolute right-0 top-0 w-2 h-full opacity-0 hover:opacity-100 bg-blue-400 rounded-r-lg transition-opacity"
                    onDragOver={handleTopicDragOver}
                    onDrop={(e) => handleTopicDrop(e, selectedDate, index + 1)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics and Questions */}
        <div className="space-y-6">
          {currentDateGroup?.topics.map(topic => {
            const allTopicQuestions = getQuestionsWithDuplicates(topic.questions);
            let filteredQuestions = filteredQuestionNumber 
              ? allTopicQuestions.filter(q => q.number === filteredQuestionNumber)
              : allTopicQuestions;
            
            // Apply search filter
            if (searchQuery.trim()) {
              filteredQuestions = filteredQuestions.filter(q => 
                q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.answer.toLowerCase().includes(searchQuery.toLowerCase())
              );
            }
            
            // Skip topics that have no questions after filtering
            if ((filteredQuestionNumber || searchQuery.trim()) && filteredQuestions.length === 0) {
              return null;
            }

            const topicKey = `${selectedDate}-${topic.id}`;
            const pagination = getPaginatedQuestions(filteredQuestions, topicKey);
            const { questions: paginatedQuestions, totalPages, currentPage, totalQuestions } = pagination;

            return (
              <div key={topic.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  {editingTopic?.dateId === selectedDate && editingTopic?.topicId === topic.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editTopicValue}
                        onChange={(e) => setEditTopicValue(e.target.value)}
                        className="text-2xl font-bold text-indigo-800 bg-transparent border-b-2 border-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={saveTopicEdit}
                        className="text-green-600 hover:text-green-800 transition"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelTopicEdit}
                        className="text-gray-600 hover:text-gray-800 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
                        {topic.name}
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-normal">
                          {totalQuestions}
                          {filteredQuestionNumber && ` (filtered)`}
                          {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
                        </span>
                      </h2>
                      {!filteredQuestionNumber && (
                        <button
                          onClick={() => startEditingTopic(selectedDate, topic.id)}
                          className="text-blue-500 hover:text-blue-700 transition"
                          title="Edit topic name"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                  {!filteredQuestionNumber && (
                    <div className="flex items-center gap-2">
                      {topic.questions.length > 0 && (
                        <button
                          onClick={() => deleteAllQuestions(selectedDate, topic.id)}
                          className="text-orange-500 hover:text-orange-700 transition text-sm px-2 py-1 border border-orange-300 rounded"
                          title="Delete all questions in this topic"
                        >
                          Clear All
                        </button>
                      )}
                      <button
                        onClick={() => deleteTopic(selectedDate, topic.id)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Delete topic"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && !filteredQuestionNumber && (
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <button
                      onClick={() => setTopicPage(topicKey, Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setTopicPage(topicKey, pageNum)}
                        className={`px-3 py-1 rounded text-sm ${
                          pageNum === currentPage 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setTopicPage(topicKey, Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      →
                    </button>
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-3 mb-4">
                  {paginatedQuestions.map((q, index) => {
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
                      draggable={!isEditing && !isExpanded}
                      onDragStart={(e) => !isEditing && !isExpanded && handleDragStart(e, selectedDate, topic.id, q.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, selectedDate, topic.id, index)}
                    >
                      <div
                        onClick={() => !isEditing && toggleQuestionExpansion(selectedDate, topic.id, q.id)}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleQuestion(selectedDate, topic.id, q.id);
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                              q.isToggled 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'bg-red-500 border-red-500 text-white'
                            }`}
                            title={q.isToggled ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {q.isToggled ? <Check size={12} /> : <X size={12} />}
                          </button>
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
                              {/* Schedule for Revision */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const key = `${selectedDate}-${topic.id}-${q.id}`;
                                    setShowDatePicker(prev => ({ ...prev, [key]: !prev[key] }));
                                  }}
                                  className="text-purple-500 hover:text-purple-700 transition p-1"
                                  title="Schedule for revision"
                                >
                                  <Calendar size={14} />
                                </button>
                                {showDatePicker[`${selectedDate}-${topic.id}-${q.id}`] && (
                                  <div className="absolute top-8 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                                    <div className="text-xs text-gray-600 mb-2">Schedule for revision:</div>
                                    <input
                                      type="date"
                                      min={new Date().toISOString().split('T')[0]}
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          scheduleQuestionForRevision(selectedDate, topic.id, q.id, e.target.value);
                                        }
                                      }}
                                      className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const key = `${selectedDate}-${topic.id}-${q.id}`;
                                        setShowDatePicker(prev => ({ ...prev, [key]: false }));
                                      }}
                                      className="ml-2 text-gray-400 hover:text-gray-600"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {q.isDuplicate && (
                            <div className="flex items-center gap-1">
                              <Link size={14} className="text-yellow-600" />
                              <div className="flex gap-1">
                                {q.duplicateOf?.map(dupNum => (
                                  <div key={dupNum} className="relative group">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        filterByQuestionNumber(dupNum);
                                      }}
                                      title={`Filter to show question #${dupNum}`}
                                      className="bg-yellow-600 text-white px-1 py-0.5 rounded text-xs hover:bg-yellow-700"
                                    >
                                      {dupNum}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Remove duplicate link between question #${q.number} and question #${dupNum}?`)) {
                                          removeDuplicateLink(q.number, dupNum);
                                        }
                                      }}
                                      title={`Remove duplicate link with question #${dupNum}`}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      ×
                                    </button>
                                  </div>
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
                          
                          {/* Manual Duplicate Selector */}
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <label className="text-sm font-medium text-gray-600">Mark as duplicate of questions:</label>
                              {!showDuplicateSelector[duplicateKey] ? (
                                <button
                                  onClick={() => setShowDuplicateSelector(prev => ({ ...prev, [duplicateKey]: true }))}
                                  className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                                >
                                  Select Questions
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => addManualDuplicate(selectedDate, topic.id, q.number)}
                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                    disabled={!selectedDuplicates[duplicateKey] || selectedDuplicates[duplicateKey].length === 0}
                                  >
                                    Link Selected ({selectedDuplicates[duplicateKey]?.length || 0})
                                  </button>
                                  <button
                                    onClick={() => {
                                      setShowDuplicateSelector(prev => ({ ...prev, [duplicateKey]: false }));
                                      setSelectedDuplicates(prev => ({ ...prev, [duplicateKey]: [] }));
                                    }}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {showDuplicateSelector[duplicateKey] && (
                              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="text-xs text-gray-500 mb-2">Select questions to mark as duplicates:</div>
                                <div className="space-y-2">
                                  {getAllQuestions()
                                    .filter(item => item.question.number !== q.number) // Exclude self
                                    .map(item => {
                                      const isSelected = selectedDuplicates[duplicateKey]?.includes(item.question.number) || false;
                                      return (
                                        <div
                                          key={`${item.dateId}-${item.topicId}-${item.question.id}`}
                                          className={`p-2 rounded cursor-pointer text-xs border transition ${
                                            isSelected 
                                              ? 'bg-yellow-200 border-yellow-400' 
                                              : 'bg-white border-gray-200 hover:bg-gray-100'
                                          }`}
                                          onClick={() => toggleDuplicateSelection(duplicateKey, item.question.number)}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                              isSelected ? 'bg-yellow-600 text-white' : 'bg-indigo-600 text-white'
                                            }`}>
                                              #{item.question.number}
                                            </span>
                                            <span className="text-gray-500">
                                              {new Date(item.date).toLocaleDateString()} • {item.topicName}
                                            </span>
                                          </div>
                                          <div className="mt-1 text-gray-700 line-clamp-2">
                                            {item.question.question}
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Question Form */}
              {!filteredQuestionNumber && (() => {
                const formKey = `${selectedDate}-${topic.id}`;
                return !showQuestionForm[formKey] ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openQuestionPopup(topic.id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add Question (Popup)
                    </button>
                    <button
                      onClick={() => setShowQuestionForm(prev => ({ ...prev, [formKey]: true }))}
                      className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Add Question (Inline)
                    </button>
                  </div>
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
            );
          }).filter(Boolean)}
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
          </>
        ) : (
          /* Revision Reminders Tab */
          <>
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={revisionSearchQuery}
                  onChange={(e) => setRevisionSearchQuery(e.target.value)}
                  placeholder="Search revision questions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {revisionSearchQuery && (
                  <button
                    onClick={() => setRevisionSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                  <Calendar size={24} />
                  Revision Schedule ({revisionDateGroups.reduce((sum, dg) => sum + dg.topics.reduce((tsum, t) => tsum + t.questions.length, 0), 0)} total)
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRevisionViewMode('list')}
                    className={`px-3 py-1 rounded text-sm transition ${
                      revisionViewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setRevisionViewMode('calendar')}
                    className={`px-3 py-1 rounded text-sm transition ${
                      revisionViewMode === 'calendar' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Calendar View
                  </button>
                </div>
              </div>
              
              {revisionViewMode === 'list' ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {revisionDateGroups.map(dateGroup => (
                    <div
                      key={dateGroup.id}
                      className={`relative group rounded-lg transition flex items-center gap-2 ${
                        selectedRevisionDate === dateGroup.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedRevisionDate(dateGroup.id)}
                        className="px-4 py-2 flex items-center gap-2 flex-1"
                      >
                        {new Date(dateGroup.date).toLocaleDateString()}
                        <span className="bg-white text-black bg-opacity-20 px-2 py-1 rounded text-sm">
                          {dateGroup.topics.reduce((sum, t) => sum + t.questions.length, 0)}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => setRevisionCalendarDate(new Date(revisionCalendarDate.getFullYear(), revisionCalendarDate.getMonth() - 1, 1))}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      ←
                    </button>
                    <h3 className="text-lg font-semibold">
                      {generateCalendar(revisionCalendarDate).monthName}
                    </h3>
                    <button
                      onClick={() => setRevisionCalendarDate(new Date(revisionCalendarDate.getFullYear(), revisionCalendarDate.getMonth() + 1, 1))}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      →
                    </button>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-semibold text-gray-600 py-2">
                        {day}
                      </div>
                    ))}
                    {generateCalendar(revisionCalendarDate).days.map((day, index) => {
                      const isCurrentMonth = day.getMonth() === revisionCalendarDate.getMonth();
                      const dateStr = day.toISOString().split('T')[0];
                      const revisionGroup = revisionDateGroups.find(dg => dg.id === dateStr);
                      const questionCount = revisionGroup ? revisionGroup.topics.reduce((sum, t) => sum + t.questions.length, 0) : 0;
                      const isSelected = selectedRevisionDate === dateStr;
                      const isToday = new Date().toDateString() === day.toDateString();
                      
                      return (
                        <div
                          key={index}
                          className={`
                            min-h-[50px] p-1 border rounded cursor-pointer transition
                            ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                            ${isSelected ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}
                            ${isToday ? 'ring-2 ring-purple-400' : ''}
                          `}
                          onClick={() => setSelectedRevisionDate(dateStr)}
                        >
                          <div className="text-center text-sm font-medium">
                            {day.getDate()}
                          </div>
                          {questionCount > 0 && (
                            <div className={`text-xs text-center mt-1 px-1 py-0.5 rounded ${
                              isSelected ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-800'
                            }`}>
                              ({questionCount})
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Revision Topics and Questions */}
            <div className="space-y-6">
              {(() => {
                const currentRevisionGroup = getRevisionDateGroup(selectedRevisionDate);
                if (!currentRevisionGroup) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">No revision questions scheduled for this date.</p>
                    </div>
                  );
                }

                return currentRevisionGroup.topics.map(topic => {
                  let filteredQuestions = topic.questions;
                  
                  // Apply search filter
                  if (revisionSearchQuery.trim()) {
                    filteredQuestions = filteredQuestions.filter(q => 
                      q.question.toLowerCase().includes(revisionSearchQuery.toLowerCase()) ||
                      q.answer.toLowerCase().includes(revisionSearchQuery.toLowerCase())
                    );
                  }
                  
                  // Skip topics that have no questions after filtering
                  if (revisionSearchQuery.trim() && filteredQuestions.length === 0) {
                    return null;
                  }

                  const topicKey = `${selectedRevisionDate}-${topic.id}`;
                  const pagination = getRevisionPaginatedQuestions(filteredQuestions, topicKey);
                  const { questions: paginatedQuestions, totalPages, currentPage, totalQuestions } = pagination;

                  return (
                    <div key={topic.id} className="bg-white rounded-lg shadow-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                            {topic.name}
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-normal">
                              {totalQuestions}
                              {revisionSearchQuery && ` (filtered)`}
                              {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
                            </span>
                          </h2>
                        </div>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mb-4">
                          <button
                            onClick={() => setRevisionTopicPage(topicKey, Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                          >
                            ←
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => setRevisionTopicPage(topicKey, pageNum)}
                              className={`px-3 py-1 rounded text-sm ${
                                pageNum === currentPage 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                          <button
                            onClick={() => setRevisionTopicPage(topicKey, Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                          >
                            →
                          </button>
                        </div>
                      )}

                      {/* Questions */}
                      <div className="space-y-3 mb-4">
                        {paginatedQuestions.map((q) => {
                          const key = `${selectedRevisionDate}-${topic.id}-${q.id}`;
                          const isExpanded = expandedQuestions[key];
                          
                          return (
                            <div 
                              key={q.id} 
                              className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50"
                            >
                              <div
                                onClick={() => toggleQuestionExpansion(selectedRevisionDate, topic.id, q.id)}
                                className="flex justify-between items-center p-4 hover:bg-purple-100 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-sm font-bold min-w-[24px] text-center">
                                    {q.number}
                                  </span>
                                  <h3 className="font-semibold text-gray-800 flex-1">
                                    {q.question}
                                  </h3>
                                  {q.revisionCount && q.revisionCount > 1 && (
                                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                                      Revised {q.revisionCount} times
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Reschedule Date Picker */}
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const key = `revision-${selectedRevisionDate}-${topic.id}-${q.id}`;
                                        setShowDatePicker(prev => ({ ...prev, [key]: !prev[key] }));
                                      }}
                                      className="text-purple-500 hover:text-purple-700 transition p-1"
                                      title="Reschedule revision"
                                    >
                                      <Calendar size={14} />
                                    </button>
                                    {showDatePicker[`revision-${selectedRevisionDate}-${topic.id}-${q.id}`] && (
                                      <div className="absolute top-8 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                                        <div className="text-xs text-gray-600 mb-2">Reschedule to:</div>
                                        <input
                                          type="date"
                                          min={new Date().toISOString().split('T')[0]}
                                          onChange={(e) => {
                                            if (e.target.value && e.target.value !== selectedRevisionDate) {
                                              rescheduleRevisionQuestion(selectedRevisionDate, topic.id, q.id, e.target.value);
                                              const key = `revision-${selectedRevisionDate}-${topic.id}-${q.id}`;
                                              setShowDatePicker(prev => ({ ...prev, [key]: false }));
                                            }
                                          }}
                                          className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const key = `revision-${selectedRevisionDate}-${topic.id}-${q.id}`;
                                            setShowDatePicker(prev => ({ ...prev, [key]: false }));
                                          }}
                                          className="ml-2 text-gray-400 hover:text-gray-600"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="text-purple-600" size={20} />
                                  ) : (
                                    <ChevronDown className="text-purple-600" size={20} />
                                  )}
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="p-4 bg-white border-t border-purple-200">
                                  <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
                                    {q.answer}
                                  </p>
                                  {q.lastRevisionDate && (
                                    <div className="mt-3 text-sm text-gray-500">
                                      Last revised: {new Date(q.lastRevisionDate).toLocaleDateString()}
                                      {q.revisionCount && ` • Revision #${q.revisionCount}`}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }).filter(Boolean);
              })()}
            </div>

            {revisionDateGroups.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No revision questions scheduled yet!</p>
                <p className="text-sm mt-2">Use the calendar icon in the Revision Manager tab to schedule questions for revision.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Question Popup Modal */}
      {showQuestionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-indigo-900">Add New Question</h2>
              <button
                onClick={closeQuestionPopup}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question *
                </label>
                <input
                  type="text"
                  value={popupQuestion}
                  onChange={(e) => setPopupQuestion(e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer *
                </label>
                <textarea
                  value={popupAnswer}
                  onChange={(e) => setPopupAnswer(e.target.value)}
                  placeholder="Enter your answer here... (formatting preserved when pasting)"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-vertical"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={closeQuestionPopup}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addQuestionFromPopup}
                  disabled={!popupQuestion.trim() || !popupAnswer.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Form Modal */}
      {showReminderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-green-800">Add New Reminder</h2>
              <button
                onClick={() => {
                  setShowReminderForm(false);
                  setNewReminder({ title: '', description: '', scheduledDate: '', selectedQuestions: [] });
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter reminder title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newReminder.description}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={newReminder.scheduledDate}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associated Questions (Optional)
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-3">Select questions to include in this reminder:</div>
                  {getAllQuestions().length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No questions available. Create questions first in the Revision Manager tab.</p>
                  ) : (
                    <div className="space-y-2">
                      {getAllQuestions().map(item => {
                        const isSelected = newReminder.selectedQuestions.includes(item.question.number);
                        return (
                          <div
                            key={`${item.dateId}-${item.topicId}-${item.question.id}`}
                            className={`p-3 rounded cursor-pointer text-sm border transition ${
                              isSelected 
                                ? 'bg-green-200 border-green-400' 
                                : 'bg-white border-gray-200 hover:bg-gray-100'
                            }`}
                            onClick={() => {
                              setNewReminder(prev => ({
                                ...prev,
                                selectedQuestions: isSelected
                                  ? prev.selectedQuestions.filter(q => q !== item.question.number)
                                  : [...prev.selectedQuestions, item.question.number]
                              }));
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                isSelected ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'
                              }`}>
                                #{item.question.number}
                              </span>
                              <span className="text-gray-500">
                                {new Date(item.date).toLocaleDateString()} • {item.topicName}
                              </span>
                            </div>
                            <div className="mt-1 text-gray-700 line-clamp-2">
                              {item.question.question}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {newReminder.selectedQuestions.length > 0 && (
                  <div className="mt-2 text-sm text-green-600">
                    Selected: {newReminder.selectedQuestions.length} questions
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowReminderForm(false);
                    setNewReminder({ title: '', description: '', scheduledDate: '', selectedQuestions: [] });
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addReminder}
                  disabled={!newReminder.title.trim() || !newReminder.scheduledDate}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}