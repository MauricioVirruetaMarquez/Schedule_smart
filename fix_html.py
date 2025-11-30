import re

# Read the original file
with open(r'c:\Users\sebas\Downloads\Schedule_smart\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the problematic section starting at line 768 (index 767)
lines = content.split('\n')

# The problem starts at line 768 where there's a <div class="rdf-card"> inside a <select>
# We need to:
# 1. Close the select properly with the remaining options
# 2. Remove all the duplicate content from line 768 to line 931
# 3. Keep the proper structure after that

# Find the exact positions
start_marker = '                  <option value="trabajo">Trabajo</option>\r'
end_marker = '                    </div>\r'

# Create the corrected content
# We'll replace everything from after "trabajo" option to before the proper closing
corrected_lines = []
skip = False
skip_count = 0

for i, line in enumerate(lines):
    line_num = i + 1
    
    # Start skipping after line 767 (trabajo option)
    if line_num == 768:
        # Add the remaining options and close the select
        corrected_lines.append('                  <option value="estudio">Estudio</option>\r')
        corrected_lines.append('                  <option value="salud">Salud</option>\r')
        corrected_lines.append('                  <option value="social">Social</option>\r')
        corrected_lines.append('                </select>\r')
        corrected_lines.append('              </div>\r')
        corrected_lines.append('\r')
        corrected_lines.append('              <div class="detail-actions">\r')
        corrected_lines.append('                <button class="btn-edit" id="editEventBtn">Editar</button>\r')
        corrected_lines.append('                <button class="btn-save" id="saveEventBtn" style="display:none;">Guardar Cambios</button>\r')
        corrected_lines.append('                <button class="btn-delete" id="deleteEventBtn">Eliminar</button>\r')
        corrected_lines.append('                <button class="btn-close" id="closeDetailBtn">Cerrar</button>\r')
        corrected_lines.append('              </div>\r')
        corrected_lines.append('            </div>\r')
        corrected_lines.append('          </div>\r')
        corrected_lines.append('        </div>\r')
        corrected_lines.append('      </div>\r')
        corrected_lines.append('    </div>\r')
        skip = True
        continue
    
    # Stop skipping at line 969 (where scripts start)
    if line_num == 969:
        skip = False
    
    if not skip:
        corrected_lines.append(line)

# Write the corrected content
with open(r'c:\Users\sebas\Downloads\Schedule_smart\index.html', 'w', encoding='utf-8') as f:
    f.write('\n'.join(corrected_lines))

print("File corrected successfully!")
print(f"Original lines: {len(lines)}")
print(f"Corrected lines: {len(corrected_lines)}")
