// Copy Code Function
function copyCode(elementId) {
    const element = document.getElementById(elementId);
    const text = element.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Code copied to clipboard!');
    }).catch(err => {
        console.error('Error copying text: ', err);
    });
}

// Syntax Highlighting (simplified)
document.addEventListener('DOMContentLoaded', function() {
    const htmlCode = document.getElementById('html-code');
    const cssCode = document.getElementById('css-code');
    
    // Simple tag highlighting for HTML
    if(htmlCode) {
        htmlCode.innerHTML = htmlCode.innerHTML.replace(
            /&lt;(\/?\w+)/g, 
            '<span class="html-tag">&lt;$1</span>'
        );
    }
    
    // Simple highlighting for CSS
    if(cssCode) {
        cssCode.innerHTML = cssCode.innerHTML.replace(
            /([^{}]+){/g, 
            '<span class="css-selector">$1</span>{'
        );
        
        cssCode.innerHTML = cssCode.innerHTML.replace(
            /([a-zA-Z-]+):/g, 
            '<span class="css-property">$1</span>:'
        );
    }
});
